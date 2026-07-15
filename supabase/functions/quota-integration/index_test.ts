// Integration tests for the server-side quota system.
//
// These tests hit the REAL Supabase project referenced by the local `.env`.
// They provision a throwaway auth user via the admin API, then verify that:
//   1. RLS on `public.usage_counters` blocks direct client writes (INSERT/
//      UPDATE/DELETE) even for the row-owner, since every write policy is
//      `USING(false)`.
//   2. The `consume_quota` SECURITY DEFINER RPC increments the counter,
//      returns `allowed=true` up to the per-tool limit, and switches to
//      `allowed=false` / `reason=quota_exceeded` past that limit — WITHOUT
//      over-incrementing (the rejected call is rolled back).
//   3. Quiz single-shot: `can_retake_quiz` allows the first attempt, and
//      `record_quiz_completion` flips it to `quiz_already_completed`.
//
// The test cleans up its user, usage rows and quiz row via the service_role
// client at the end. If service credentials are not available in the runner,
// the whole suite is skipped rather than failing spuriously.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL") ?? "";
const ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const canRun = Boolean(SUPABASE_URL && ANON_KEY && SERVICE_ROLE_KEY);

function skipIfNoCreds(name: string, fn: () => Promise<void>) {
  Deno.test({
    name,
    ignore: !canRun,
    fn,
    sanitizeOps: false,
    sanitizeResources: false,
  });
}

async function provisionUser() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const email = `quota-it-${crypto.randomUUID()}@example.test`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("no user");
  const userId = data.user.id;

  const signInClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: sess, error: signInErr } =
    await signInClient.auth.signInWithPassword({ email, password });
  if (signInErr || !sess.session) throw signInErr ?? new Error("no session");

  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    },
  });
  return { admin, authed, userId, email };
}

// deno-lint-ignore no-explicit-any
async function cleanup(admin: any, userId: string) {
  await admin.from("usage_counters").delete().eq("user_id", userId);
  await admin.from("quiz_completions").delete().eq("user_id", userId);
  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId);
}

if (!canRun) {
  console.warn(
    "[quota-integration] SUPABASE_SERVICE_ROLE_KEY missing — integration tests skipped.",
  );
}

skipIfNoCreds("RLS blocks direct client writes to usage_counters", async () => {
  const { admin, authed, userId } = await provisionUser();
  try {
    const period = new Date().toISOString().slice(0, 7) + "-01";

    // INSERT as owner — RLS `WITH CHECK (false)` must reject.
    const ins = await authed
      .from("usage_counters")
      .insert({ user_id: userId, tool: "valise", period_month: period, count: 1 });
    assertNotEquals(ins.error, null, "client INSERT should be blocked by RLS");

    // Seed a row via service_role, then attempt UPDATE/DELETE as the owner.
    const seed = await admin.from("usage_counters").insert({
      user_id: userId,
      tool: "valise",
      period_month: period,
      count: 1,
    });
    assertEquals(seed.error, null);

    const upd = await authed
      .from("usage_counters")
      .update({ count: 999 })
      .eq("user_id", userId)
      .eq("tool", "valise")
      .eq("period_month", period);
    // Postgres reports no rows affected rather than an error under RLS USING(false);
    // verify the row was NOT mutated regardless.
    const check = await admin
      .from("usage_counters")
      .select("count")
      .eq("user_id", userId)
      .eq("tool", "valise")
      .eq("period_month", period)
      .single();
    assertEquals(check.data?.count, 1, "UPDATE via client must not mutate row");
    // error is optional here — some PostgREST versions return an empty array with no error.
    void upd;

    const del = await authed
      .from("usage_counters")
      .delete()
      .eq("user_id", userId)
      .eq("tool", "valise")
      .eq("period_month", period);
    const stillThere = await admin
      .from("usage_counters")
      .select("count")
      .eq("user_id", userId)
      .eq("tool", "valise")
      .eq("period_month", period)
      .maybeSingle();
    assert(stillThere.data, "DELETE via client must not remove row");
    void del;

    // Reads scoped to auth.uid() must succeed for own rows.
    const ownRead = await authed
      .from("usage_counters")
      .select("count")
      .eq("user_id", userId);
    assertEquals(ownRead.error, null);
    assert((ownRead.data ?? []).length >= 1, "owner can SELECT own rows");
  } finally {
    await cleanup(admin, userId);
  }
});

skipIfNoCreds(
  "consume_quota enforces the per-tool monthly limit and rolls back",
  async () => {
    const { admin, authed, userId } = await provisionUser();
    try {
      // `valise` limit is 3 (see public.get_quota_limit).
      const results: Array<{ allowed: boolean; used?: number; reason?: string }> = [];
      for (let i = 0; i < 4; i++) {
        const { data, error } = await authed.rpc("consume_quota", {
          _tool: "valise",
        });
        if (error) throw error;
        results.push(data as { allowed: boolean; used?: number; reason?: string });
      }

      assertEquals(results[0].allowed, true, "1st call allowed");
      assertEquals(results[1].allowed, true, "2nd call allowed");
      assertEquals(results[2].allowed, true, "3rd call allowed");
      assertEquals(results[3].allowed, false, "4th call blocked");
      assertEquals(results[3].reason, "quota_exceeded");

      // Server-side counter should be exactly 3 (the rejected 4th call is
      // undone by the RPC; no over-increment leaks through).
      const period = new Date().toISOString().slice(0, 7) + "-01";
      const row = await admin
        .from("usage_counters")
        .select("count")
        .eq("user_id", userId)
        .eq("tool", "valise")
        .eq("period_month", period)
        .single();
      assertEquals(row.error, null);
      assertEquals(row.data?.count, 3, "counter must equal limit, not exceed it");

      // get_quota_status agrees with the row.
      const status = await authed.rpc("get_quota_status", { _tool: "valise" });
      assertEquals(status.error, null);
      const payload = status.data as { used: number; limit: number; admin: boolean };
      assertEquals(payload.used, 3);
      assertEquals(payload.limit, 3);
      assertEquals(payload.admin, false);
    } finally {
      await cleanup(admin, userId);
    }
  },
);

skipIfNoCreds("quiz single-shot: retake blocked after completion", async () => {
  const { admin, authed, userId } = await provisionUser();
  try {
    const first = await authed.rpc("can_retake_quiz");
    assertEquals(first.error, null);
    assertEquals((first.data as { allowed: boolean }).allowed, true);

    const rec = await authed.rpc("record_quiz_completion");
    assertEquals(rec.error, null);
    assertEquals((rec.data as { ok: boolean }).ok, true);

    const second = await authed.rpc("can_retake_quiz");
    assertEquals(second.error, null);
    const secondPayload = second.data as { allowed: boolean; reason?: string };
    assertEquals(secondPayload.allowed, false);
    assertEquals(secondPayload.reason, "quiz_already_completed");
  } finally {
    await cleanup(admin, userId);
  }
});

skipIfNoCreds("admins bypass consume_quota entirely", async () => {
  const { admin, authed, userId } = await provisionUser();
  try {
    const grant = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    assertEquals(grant.error, null);

    // Loop past the free limit; admins should always be allowed.
    for (let i = 0; i < 6; i++) {
      const { data, error } = await authed.rpc("consume_quota", {
        _tool: "valise",
      });
      if (error) throw error;
      const payload = data as { allowed: boolean; admin?: boolean };
      assertEquals(payload.allowed, true, `admin call #${i + 1} must be allowed`);
      assertEquals(payload.admin, true);
    }

    // Admin bypass must NOT write to usage_counters.
    const period = new Date().toISOString().slice(0, 7) + "-01";
    const row = await admin
      .from("usage_counters")
      .select("count")
      .eq("user_id", userId)
      .eq("tool", "valise")
      .eq("period_month", period)
      .maybeSingle();
    assertEquals(row.data, null, "admin bypass must not create counter rows");
  } finally {
    await cleanup(admin, userId);
  }
});
