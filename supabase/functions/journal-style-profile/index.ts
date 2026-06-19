// Analyze the user's past writing to build a "style profile" used by journal-story in auto mode.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "auth required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { journalId, locale = "fr" } = await req.json().catch(() => ({}));
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pull recent text the user wrote: notes blocks + manual stories
    const { data: blocks } = await admin
      .from("journal_blocks")
      .select("type, content, updated_at")
      .eq("user_id", user.id)
      .in("type", ["note", "highlight"])
      .order("updated_at", { ascending: false })
      .limit(60);

    const { data: stories } = await admin
      .from("journal_stories")
      .select("content, tone, created_at")
      .eq("user_id", user.id)
      .eq("tone", "manual")
      .order("created_at", { ascending: false })
      .limit(10);

    const samples: string[] = [];
    for (const b of blocks || []) {
      const t = (b.content as any)?.text;
      if (t && typeof t === "string" && t.trim().length > 10) samples.push(t.trim());
    }
    for (const s of stories || []) {
      if (s.content && s.content.trim().length > 30) samples.push(s.content.trim());
    }

    const corpus = samples.join("\n---\n").slice(0, 6000);
    if (corpus.length < 80) {
      return new Response(JSON.stringify({ profile: null, reason: "not_enough_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const isEN = locale === "en";
    const sys = isEN
      ? "You analyze writing samples to extract a compact STYLE PROFILE of the author. Reply with strict JSON only."
      : "Tu analyses des extraits d'écriture pour extraire un PROFIL DE STYLE compact de l'auteur. Réponds en JSON strict uniquement.";

    const usr = `${isEN ? "SAMPLES" : "EXTRAITS"}:\n${corpus}\n\n${isEN
      ? `Return JSON: {"vocab_register":"familiar|neutral|literary","avg_sentence_length":"short|medium|long","emotional_tone":"...","signature_words":["..."],"quirks":"...","one_line_summary":"a sentence describing how this person writes"}`
      : `Renvoie JSON: {"vocab_register":"familier|neutre|littéraire","avg_sentence_length":"courtes|moyennes|longues","emotional_tone":"...","signature_words":["..."],"quirks":"...","one_line_summary":"une phrase qui décrit comment cette personne écrit"}`}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("style-profile AI error", r.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    let profile: any = {};
    try { profile = JSON.parse(data.choices?.[0]?.message?.content || "{}"); } catch { profile = {}; }

    if (journalId) {
      await admin.from("journals").update({
        style_profile: profile,
        style_profile_updated_at: new Date().toISOString(),
      }).eq("id", journalId).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ profile }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("journal-style-profile error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
