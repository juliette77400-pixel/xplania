import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Monday 00:00 of current week (UTC)
function weekStart(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun
  const diff = (day + 6) % 7; // back to Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}
function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
}

// Deterministic shuffle seeded by string
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 16777619);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "unauthorized" }, 401);
    const userId = claims.claims.sub;
    const admin = createClient(SUPABASE_URL, SERVICE);

    const ws = weekStart();
    const we = addDays(ws, 7);
    const ms = monthStart();
    const me = addMonths(ms, 1);

    // Check existing active missions for this user within current periods
    const { data: existing } = await admin
      .from("gam_current_missions")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true);

    const hasWeekly = (existing || []).some(
      (m: any) => m.scope === "weekly" && new Date(m.start_date).getTime() === ws.getTime(),
    );
    const hasMonthly = (existing || []).some(
      (m: any) => m.scope === "monthly" && new Date(m.start_date).getTime() === ms.getTime(),
    );

    // Get user prefs (categories)
    const { data: prefsRows } = await admin
      .from("gam_user_category_prefs")
      .select("category_id")
      .eq("user_id", userId);
    const catIds = (prefsRows || []).map((r: any) => r.category_id);

    // Pool of eligible badges (weekly-eligible, in preferred categories if any, not yet validated)
    const { data: validated } = await admin
      .from("gam_badge_claims")
      .select("badge_id")
      .eq("user_id", userId)
      .eq("status", "validated");
    const validatedSet = new Set((validated || []).map((c: any) => c.badge_id));

    let badgeQ = admin
      .from("gam_badges")
      .select("id,category_id,points,is_weekly_mission_eligible,active")
      .eq("active", true);
    if (catIds.length) badgeQ = badgeQ.in("category_id", catIds);
    const { data: pool } = await badgeQ;
    const eligible = (pool || []).filter((b: any) => !validatedSet.has(b.id));

    // De-activate stale missions for this user
    await admin
      .from("gam_current_missions")
      .update({ active: false })
      .eq("user_id", userId)
      .lt("end_date", new Date().toISOString());

    const inserted: any[] = [];

    if (!hasWeekly && eligible.length) {
      const weekly = eligible.filter((b: any) => b.is_weekly_mission_eligible !== false);
      const picks = seededShuffle(weekly.length ? weekly : eligible, `${userId}-w-${ws.toISOString()}`).slice(0, 3);
      for (const p of picks) {
        const { data, error } = await admin.from("gam_current_missions").insert({
          user_id: userId,
          badge_id: p.id,
          scope: "weekly",
          start_date: ws.toISOString(),
          end_date: we.toISOString(),
          active: true,
        }).select().single();
        if (!error && data) inserted.push(data);
      }
    }

    if (!hasMonthly && eligible.length) {
      // Monthly = one high-value or rare-category badge
      const sorted = [...eligible].sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
      const top = sorted.slice(0, Math.max(5, Math.floor(sorted.length * 0.2)));
      const pick = seededShuffle(top, `${userId}-m-${ms.toISOString()}`)[0];
      if (pick) {
        const { data, error } = await admin.from("gam_current_missions").insert({
          user_id: userId,
          badge_id: pick.id,
          scope: "monthly",
          start_date: ms.toISOString(),
          end_date: me.toISOString(),
          active: true,
        }).select().single();
        if (!error && data) inserted.push(data);
      }
    }

    return json({ ok: true, inserted: inserted.length, weekly_start: ws.toISOString(), monthly_start: ms.toISOString() });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
