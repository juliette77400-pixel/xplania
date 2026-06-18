import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRADIENTS = [
  "from-violet-600 via-indigo-700 to-slate-900",
  "from-fuchsia-600 via-purple-700 to-rose-900",
  "from-emerald-500 via-teal-700 to-slate-900",
  "from-cyan-400 via-sky-600 to-blue-900",
  "from-slate-600 via-slate-800 to-zinc-900",
  "from-amber-500 via-orange-700 to-rose-900",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      destination = "",
      tripType = "",
      activities = [],
      luggage = "",
      locale = "fr",
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isEN = String(locale).startsWith("en");
    const actList = Array.isArray(activities) ? activities.join(", ") : String(activities || "");

    const system = isEN
      ? `You are a travel stylist for Xplania. Generate 3 outfit ideas STRICTLY adapted to the destination, trip type, activities and typical weather there.
Return ONLY a JSON object with this exact shape:
{"outfits":[{"title":"...","context":"...","badge":"...","emoji":"👟🧥","tags":["...","..."],"items":["item 1","item 2",...],"weatherTip":"...","culturalTip":"..."}]}
- 3 outfits, distinct and complementary.
- "items": 5 to 8 concrete pieces (with material/color when relevant).
- "badge": one short label (e.g. "Day", "Evening", "Active").
- "emoji": 1-2 emojis representing the look.
- Tips: localized to ${destination || "the destination"} (real climate + local culture).
NO markdown, NO commentary, JSON only.`
      : `Tu es styliste voyage pour Xplania. Génère 3 idées de tenues STRICTEMENT adaptées à la destination, au type de voyage, aux activités et à la météo typique sur place.
Retourne UNIQUEMENT un objet JSON de cette forme exacte :
{"outfits":[{"title":"...","context":"...","badge":"...","emoji":"👟🧥","tags":["...","..."],"items":["pièce 1","pièce 2",...],"weatherTip":"...","culturalTip":"..."}]}
- 3 tenues distinctes et complémentaires.
- "items" : 5 à 8 pièces concrètes (matière/couleur si pertinent).
- "badge" : label court (ex. "Jour", "Soirée", "Actif").
- "emoji" : 1-2 emojis représentant le look.
- Conseils : localisés à ${destination || "la destination"} (climat réel + culture locale).
PAS de markdown, PAS de commentaire, uniquement le JSON.`;

    const user = isEN
      ? `Destination: ${destination || "(unknown)"}
Trip type: ${tripType || "(unknown)"}
Activities: ${actList || "(unknown)"}
Luggage: ${luggage || "(unknown)"}`
      : `Destination : ${destination || "(inconnue)"}
Type de voyage : ${tripType || "(inconnu)"}
Activités : ${actList || "(inconnues)"}
Bagage : ${luggage || "(inconnu)"}`;

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

    const outfits = Array.isArray(parsed.outfits) ? parsed.outfits.slice(0, 3) : [];
    const enriched = outfits.map((o: any, i: number) => ({
      id: `ai-${i}`,
      title: String(o.title || ""),
      context: String(o.context || ""),
      badge: String(o.badge || ""),
      emoji: String(o.emoji || "👕"),
      gradient: GRADIENTS[i % GRADIENTS.length],
      tags: Array.isArray(o.tags) ? o.tags.map((t: any) => String(t)).slice(0, 5) : [],
      items: Array.isArray(o.items) ? o.items.map((it: any) => String(it)).slice(0, 10) : [],
      weatherTip: String(o.weatherTip || ""),
      culturalTip: String(o.culturalTip || ""),
    }));

    return new Response(JSON.stringify({ outfits: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("valise-outfits error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
