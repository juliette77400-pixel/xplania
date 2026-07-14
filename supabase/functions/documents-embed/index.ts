// Admin-only edge function: generates embeddings for travel_documents rows
// where embedding IS NULL. Batched, safe to call multiple times.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const MODEL = "openai/text-embedding-3-small";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Admin check
  const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: auth.userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden — admin required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Math.max(Number(body?.batchSize) || 20, 1), 50);

    const { data: rows, error } = await supabase
      .from("travel_documents")
      .select("id, title, content")
      .is("embedding", null)
      .limit(batchSize);
    if (error) throw error;
    if (!rows?.length) {
      return new Response(JSON.stringify({ embedded: 0, remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let count = 0;
    for (const row of rows) {
      const input = `${row.title}\n${row.content}`.slice(0, 6000);
      const r = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, input }),
      });
      if (!r.ok) {
        console.error("embedding failed", row.id, r.status, await r.text());
        if (r.status === 429 || r.status === 402) break; // stop batch on rate/credit limit
        continue;
      }
      const j = await r.json();
      const embedding: number[] | undefined = j?.data?.[0]?.embedding;
      if (!embedding) continue;

      // Supabase expects vector as string literal for update
      const vec = `[${embedding.join(",")}]`;
      const { error: upErr } = await supabase
        .from("travel_documents")
        .update({ embedding: vec as unknown as never })
        .eq("id", row.id);
      if (upErr) {
        console.error("update embedding failed", row.id, upErr);
        continue;
      }
      count++;
    }

    const { count: remaining } = await supabase
      .from("travel_documents")
      .select("id", { head: true, count: "exact" })
      .is("embedding", null);

    return new Response(JSON.stringify({ embedded: count, remaining: remaining ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("documents-embed error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
