// Admin-only: insert seed RAG chunks into travel_documents and track in rag_seed_status.
// Idempotent: chunks are keyed by chunk_key and skipped if already inserted.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeedChunk {
  chunk_key: string;
  destination_slug: string;
  title: string;
  content: string;
  category?: string;
  locale?: string;
  source?: string;
  source_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: isAdmin, error: roleErr } = await supa.rpc("has_role", {
    _user_id: auth.userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden — admin required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const chunks = (body?.chunks ?? []) as SeedChunk[];
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return new Response(JSON.stringify({ error: "chunks array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ chunk_key: string; status: "inserted" | "skipped" | "error"; error?: string }> = [];

    for (const c of chunks) {
      if (!c.chunk_key || !c.destination_slug || !c.title || !c.content) {
        results.push({ chunk_key: c.chunk_key ?? "?", status: "error", error: "missing fields" });
        continue;
      }
      // Look up existing status by chunk_key
      const { data: existing } = await supa
        .from("rag_seed_status")
        .select("id, document_id")
        .eq("chunk_key", c.chunk_key)
        .maybeSingle();

      if (existing?.document_id) {
        results.push({ chunk_key: c.chunk_key, status: "skipped" });
        continue;
      }

      // Resolve destination_id if possible
      const { data: dest } = await supa
        .from("destinations")
        .select("id")
        .eq("slug", c.destination_slug)
        .maybeSingle();

      const { data: doc, error: docErr } = await supa
        .from("travel_documents")
        .insert({
          destination_id: dest?.id ?? null,
          destination_slug: c.destination_slug,
          title: c.title,
          content: c.content,
          category: c.category ?? "general",
          locale: c.locale ?? "fr",
          source: c.source ?? "seed",
          source_url: c.source_url ?? null,
        })
        .select("id")
        .single();

      if (docErr || !doc) {
        results.push({ chunk_key: c.chunk_key, status: "error", error: docErr?.message ?? "insert failed" });
        continue;
      }

      await supa.from("rag_seed_status").upsert(
        {
          chunk_key: c.chunk_key,
          destination_slug: c.destination_slug,
          title: c.title,
          document_id: doc.id,
          status: "inserted",
          seeded_by: auth.userId,
        },
        { onConflict: "chunk_key" },
      );

      results.push({ chunk_key: c.chunk_key, status: "inserted" });
    }

    const inserted = results.filter((r) => r.status === "inserted").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    return new Response(JSON.stringify({ inserted, skipped, errors, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rag-seed-chunks error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
