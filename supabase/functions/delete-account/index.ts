// Deletes the calling user's auth account.
// Triggers cascade deletes on every table whose user_id FK references auth.users(id) ON DELETE CASCADE.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "missing_token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the JWT and resolve the user
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional double-check via body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      /* no body is fine */
    }
    if (body?.confirm !== "DELETE") {
      return new Response(JSON.stringify({ error: "confirmation_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const uid = userData.user.id;

    // Remove every stored file (photos, audio, documents, proofs, avatar) under `${uid}/`.
    const BUCKETS = ["journal-media", "trip-documents", "badge-proofs", "place-reviews", "avatars"];
    const collect = async (bucket: string, prefix: string, acc: string[], depth = 0) => {
      if (depth > 4) return;
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await adminClient.storage.from(bucket).list(prefix, { limit: 1000, offset });
        if (error || !data?.length) break;
        for (const it of data) {
          const p = `${prefix}/${it.name}`;
          if (it.id) acc.push(p);
          else await collect(bucket, p, acc, depth + 1);
        }
        if (data.length < 1000) break;
      }
    };
    for (const bucket of BUCKETS) {
      const paths: string[] = [];
      await collect(bucket, uid, paths);
      for (let i = 0; i < paths.length; i += 100) {
        await adminClient.storage.from(bucket).remove(paths.slice(i, i + 100));
      }
    }

    const { error: delErr } = await adminClient.auth.admin.deleteUser(uid);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
