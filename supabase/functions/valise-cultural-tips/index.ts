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
      variation = 0,
    } = await req.json();

    if (!destination || typeof destination !== "string") {
      return new Response(JSON.stringify({ error: "missing_destination" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isEN = String(locale).startsWith("en");

    const ANGLES_FR = [
      "Adopte l'angle d'un local qui accueille un ami : confidences pratiques, anecdotes vécues, lieux nommément cités.",
      "Adopte l'angle d'un guide culturel expérimenté : règles non écrites, gestes précis, vocabulaire local utile.",
      "Adopte l'angle d'un voyageur qui a déjà commis des impairs : exemples concrets d'erreurs et comment les éviter.",
      "Adopte l'angle d'un anthropologue de terrain : nuances régionales, contexte historique court, rituels précis.",
      "Adopte l'angle d'un photographe / créateur de contenu : ce qui se fait et ne se fait PAS quand on photographie sur place.",
    ];
    const ANGLES_EN = [
      "Take the angle of a local welcoming a friend: practical insider tips, lived anecdotes, named places.",
      "Take the angle of a seasoned cultural guide: unwritten rules, precise gestures, useful local words.",
      "Take the angle of a respectful traveler who has made mistakes: concrete examples of faux-pas and how to avoid them.",
      "Take the angle of a field anthropologist: regional nuances, short historical context, precise rituals.",
      "Take the angle of a content creator / photographer: what is OK and what is NOT when photographing on site.",
    ];
    const v = Number.isFinite(Number(variation)) ? Math.abs(Math.floor(Number(variation))) : 0;
    const angle = (isEN ? ANGLES_EN : ANGLES_FR)[v % (isEN ? ANGLES_EN.length : ANGLES_FR.length)];

    const system = isEN
      ? `You are a cultural travel advisor for Xplania. Generate 4 SHORT, CONCRETE cultural tips STRICTLY localized to the destination.
HARD REQUIREMENTS:
- Mention at least one REAL local place, neighborhood, monument or local word per tip when relevant (e.g. "in Gion district", "at Fushimi Inari", "say 'sumimasen'").
- Cite concrete numbers when meaningful (typical tip %, opening hours, ticket prices in local currency, dress-code thresholds).
- NEVER produce generic advice that could apply to any country.
- Each text: 2 sentences max, concrete and actionable.
- Titles: 3-5 words, specific (not "Be respectful").
${angle}
Return ONLY a JSON object with this exact shape:
{"tips":{"dress":{"title":"...","text":"..."},"customs":{"title":"...","text":"..."},"avoid":{"title":"...","text":"..."},"behavior":{"title":"...","text":"..."}}}
NO markdown, NO commentary, JSON only.`
      : `Tu es conseiller culturel voyage pour Xplania. Génère 4 conseils culturels COURTS et CONCRETS, STRICTEMENT localisés à la destination.
EXIGENCES IMPÉRATIVES :
- Mentionne au moins un VRAI nom de lieu, quartier, monument ou mot local pertinent dans chaque conseil (ex. "dans le quartier de Gion", "à Fushimi Inari", "dites 'sumimasen'").
- Cite des chiffres concrets quand pertinent (% de pourboire, horaires, prix en devise locale, seuils de dress code).
- JAMAIS de conseil générique qui pourrait s'appliquer à n'importe quel pays.
- Chaque texte : 2 phrases max, concret et actionnable.
- Titres : 3-5 mots, spécifiques (pas "Soyez respectueux").
${angle}
Retourne UNIQUEMENT un objet JSON de cette forme exacte :
{"tips":{"dress":{"title":"...","text":"..."},"customs":{"title":"...","text":"..."},"avoid":{"title":"...","text":"..."},"behavior":{"title":"...","text":"..."}}}
PAS de markdown, PAS de commentaire, uniquement le JSON.`;

    const user = isEN
      ? `Destination: ${destination}
Trip type: ${tripType || "(unknown)"}
Variation seed: ${v} (produce a result clearly different from previous variations).`
      : `Destination : ${destination}
Type de voyage : ${tripType || "(inconnu)"}
Graine de variation : ${v} (produis un résultat clairement différent des variations précédentes).`;

    console.log("[valise-cultural-tips] generating", { destination, tripType, locale: isEN ? "en" : "fr", variation: v });

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
        temperature: 0.95,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error("[valise-cultural-tips] AI gateway error", response.status, txt);
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
      throw new Error(`AI gateway ${response.status}: ${txt.slice(0, 200)}`);
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

    if (!tips.dress.text || !tips.customs.text) {
      console.error("[valise-cultural-tips] empty tips after parse", { raw: raw.slice(0, 400) });
    }

    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[valise-cultural-tips] error", e instanceof Error ? e.stack || e.message : e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
