import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      destination = "",
      tripType = "",
      locale = "fr",
    } = await req.json();

    if (!destination || typeof destination !== "string") {
      return new Response(JSON.stringify({ error: "missing_destination" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isEN = String(locale).startsWith("en");

    const system = isEN
      ? `You are a cultural travel advisor for Xplania. Generate 4 SHORT, CONCRETE cultural tips STRICTLY localized to the destination (real local customs, dress codes, etiquette and behaviors — NEVER generic).
Return ONLY a JSON object with this exact shape:
{"tips":{"dress":{"title":"...","text":"..."},"customs":{"title":"...","text":"..."},"avoid":{"title":"...","text":"..."},"behavior":{"title":"...","text":"..."}}}
- dress: how to dress on site (climate + cultural norms).
- customs: 2-3 essential local customs to know.
- avoid: 2-3 concrete things to absolutely avoid.
- behavior: positive behaviors expected by locals.
- Title: 3-5 words. Text: 1-2 sentences, concrete.
NO markdown, NO commentary, JSON only.`
      : `Tu es conseiller culturel voyage pour Xplania. Génère 4 conseils culturels COURTS et CONCRETS, STRICTEMENT localisés à la destination (vraies coutumes, dress code, étiquette, comportements locaux — JAMAIS générique).
Retourne UNIQUEMENT un objet JSON de cette forme exacte :
{"tips":{"dress":{"title":"...","text":"..."},"customs":{"title":"...","text":"..."},"avoid":{"title":"...","text":"..."},"behavior":{"title":"...","text":"..."}}}
- dress : comment s'habiller sur place (climat + normes culturelles).
- customs : 2-3 coutumes locales essentielles à connaître.
- avoid : 2-3 choses concrètes à absolument éviter.
- behavior : comportements positifs attendus par les locaux.
- Titre : 3-5 mots. Texte : 1-2 phrases, concret.
PAS de markdown, PAS de commentaire, uniquement le JSON.`;

    const user = isEN
      ? `Destination: ${destination}
Trip type: ${tripType || "(unknown)"}`
      : `Destination : ${destination}
Type de voyage : ${tripType || "(inconnu)"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      console.error("AI gateway error", response.status, txt);
      throw new Error(`AI gateway ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";

    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch { parsed = {}; } }
    }

    const src = parsed.tips || {};
    const keys = ["dress", "customs", "avoid", "behavior"] as const;
    const tips: Record<string, { title: string; text: string }> = {};
    for (const k of keys) {
      tips[k] = {
        title: String(src?.[k]?.title || ""),
        text: String(src?.[k]?.text || ""),
      };
    }

    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("valise-cultural-tips error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
