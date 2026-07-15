import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";

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
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "valise-outfits", subject: __auth.userId, limit: 20, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  const __quota = await enforceQuota("valise", req, corsHeaders);
  if (__quota) return __quota;


  try {
    const {
      destination = "",
      tripType = "",
      activities = [],
      luggage = "",
      locale = "fr",
      variation = 0,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isEN = String(locale).startsWith("en");
    const actList = Array.isArray(activities) ? activities.join(", ") : String(activities || "");

    const ANGLES_FR = [
      "Pense 'jour / soirée / activité' : trois moments distincts, palettes de couleurs différentes.",
      "Pense 'tendance locale' : inspire-toi des codes vestimentaires actuels sur place (rues, cafés, créateurs locaux).",
      "Pense 'météo extrême' : prépare des tenues qui gèrent un imprévu (averse, vent, vague de chaleur typique de la destination).",
      "Pense 'minimaliste-fonctionnel' : pièces multi-usages, matières techniques, peu d'accessoires.",
      "Pense 'photogénique' : tenues qui rendent bien sur les spots iconiques de la destination, sans être déplacées culturellement.",
    ];
    const ANGLES_EN = [
      "Think 'day / evening / activity': three distinct moments, different color palettes.",
      "Think 'local trend': draw from current dress codes on site (streets, cafés, local designers).",
      "Think 'extreme weather': prepare outfits that handle a typical local hazard (shower, wind, heatwave).",
      "Think 'minimal-functional': multi-purpose pieces, technical fabrics, few accessories.",
      "Think 'photogenic': outfits that look great at the destination's iconic spots without being culturally inappropriate.",
    ];
    const v = Number.isFinite(Number(variation)) ? Math.abs(Math.floor(Number(variation))) : 0;
    const angle = (isEN ? ANGLES_EN : ANGLES_FR)[v % (isEN ? ANGLES_EN.length : ANGLES_FR.length)];

    const system = isEN
      ? `You are a travel stylist for Xplania. Generate 3 outfit ideas STRICTLY adapted to the destination, trip type, activities and typical weather there.
HARD REQUIREMENTS:
- "context" must name a REAL place or moment on site (e.g. "Sunset walk at Kiyomizu-dera", "Tapas dinner in El Born, Barcelona").
- "weatherTip" and "culturalTip" must cite concrete local facts (real seasonal temperature range, named neighborhood dress code, local etiquette word).
- "items" must be specific (fabric + color when relevant), not generic ("white linen shirt" not "a shirt").
- Three outfits must be CLEARLY different from each other (different occasion, palette and silhouette).
${angle}
Return ONLY a JSON object with this exact shape:
{"outfits":[{"title":"...","context":"...","badge":"...","emoji":"👟🧥","tags":["...","..."],"items":["item 1","item 2",...],"weatherTip":"...","culturalTip":"..."}]}
NO markdown, NO commentary, JSON only.`
      : `Tu es styliste voyage pour Xplania. Génère 3 idées de tenues STRICTEMENT adaptées à la destination, au type de voyage, aux activités et à la météo typique sur place.
EXIGENCES IMPÉRATIVES :
- "context" doit nommer un VRAI lieu ou moment sur place (ex. "Coucher de soleil à Kiyomizu-dera", "Dîner tapas dans El Born à Barcelone").
- "weatherTip" et "culturalTip" doivent citer des faits locaux concrets (vraie plage de températures saisonnières, dress code d'un quartier nommé, mot d'étiquette locale).
- "items" doivent être spécifiques (matière + couleur quand pertinent), pas génériques ("chemise en lin blanc" et pas "une chemise").
- Les 3 tenues doivent être CLAIREMENT différentes (occasion, palette et silhouette différentes).
${angle}
Retourne UNIQUEMENT un objet JSON de cette forme exacte :
{"outfits":[{"title":"...","context":"...","badge":"...","emoji":"👟🧥","tags":["...","..."],"items":["pièce 1","pièce 2",...],"weatherTip":"...","culturalTip":"..."}]}
PAS de markdown, PAS de commentaire, uniquement le JSON.`;

    const user = isEN
      ? `Destination: ${destination || "(unknown)"}
Trip type: ${tripType || "(unknown)"}
Activities: ${actList || "(unknown)"}
Luggage: ${luggage || "(unknown)"}
Variation seed: ${v} (produce outfits clearly different from previous variations).`
      : `Destination : ${destination || "(inconnue)"}
Type de voyage : ${tripType || "(inconnu)"}
Activités : ${actList || "(inconnues)"}
Bagage : ${luggage || "(inconnu)"}
Graine de variation : ${v} (produis des tenues clairement différentes des variations précédentes).`;

    console.log("[valise-outfits] generating", { destination, tripType, locale: isEN ? "en" : "fr", variation: v });

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
      console.error("[valise-outfits] AI gateway error", response.status, txt);
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

    const outfits = Array.isArray(parsed.outfits) ? parsed.outfits.slice(0, 3) : [];
    if (outfits.length === 0) {
      console.error("[valise-outfits] empty outfits after parse", { raw: raw.slice(0, 400) });
    }
    const gradientOffset = v % GRADIENTS.length;
    const enriched = outfits.map((o: any, i: number) => ({
      id: `ai-${v}-${i}`,
      title: String(o.title || ""),
      context: String(o.context || ""),
      badge: String(o.badge || ""),
      emoji: String(o.emoji || "👕"),
      gradient: GRADIENTS[(gradientOffset + i) % GRADIENTS.length],
      tags: Array.isArray(o.tags) ? o.tags.map((t: any) => String(t)).slice(0, 5) : [],
      items: Array.isArray(o.items) ? o.items.map((it: any) => String(it)).slice(0, 10) : [],
      weatherTip: String(o.weatherTip || ""),
      culturalTip: String(o.culturalTip || ""),
    }));

    return new Response(JSON.stringify({ outfits: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[valise-outfits] error", e instanceof Error ? e.stack || e.message : e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
