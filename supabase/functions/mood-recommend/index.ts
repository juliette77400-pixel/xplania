import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { buildTravelContext, contextToPromptSnippet, recordShownRecommendations } from "../_shared/travel-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;
  const __rl = checkRateLimit({ key: "mood-recommend", subject: __auth.userId, limit: 20, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json();
    const {
      mood,
      free_input,
      energy_level,
      lat,
      lng,
      weather,
      time_of_day,
      budget,
      surprise = false,
      city_hint,
      locale = "fr",
    } = body || {};
    const isEN = locale === "en";

    if (!mood && !free_input && !surprise) {
      return new Response(JSON.stringify({ error: "mood ou free_input requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // History (last 5 moods) for personalization
    const { data: history } = await supabase
      .from("mood_selections")
      .select("mood, free_input, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const finalMood = surprise
      ? ["chill", "explore", "romantic", "food", "party", "nature", "focus"][Math.floor(Math.random() * 7)]
      : mood;

    // Insert selection
    const { data: selection } = await supabase
      .from("mood_selections")
      .insert({
        user_id: user.id,
        mood: finalMood,
        free_input: free_input || null,
        energy_level: energy_level ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        weather: weather || null,
        time_of_day: time_of_day || null,
        context: { budget, surprise, city_hint, locale },
      })
      .select()
      .single();

    const systemPrompt = isEN
      ? `You are an expert local emotional guide. You recommend REAL and HYPER-LOCAL places based on a sought emotion / sensation.
Strict rules:
- REAL and localized places (use GPS position and city)
- MANDATORY DIVERSITY: mix MANDATORILY several types from {restaurant, café, bar, museum, gallery, park, viewpoint, activity, workshop, unusual spot, local experience}. Max 2 places of the same category out of 6.
- For each place, write an ULTRA personalized emotional sentence "why_fits" explaining why this place matches the mood (poetic style, short, punchy, in ENGLISH, 2nd person "you")
- Prefer hidden gems, off-the-beaten-track places when relevant
- Adapt to weather, time and history
- Always reply via the function call return_mood_places. ALL text in ENGLISH.`
      : `Tu es un guide local émotionnel expert. Tu recommandes des lieux RÉELS et HYPER LOCAUX en fonction d'une émotion / sensation recherchée.
Règles strictes :
- Lieux RÉELS et localisés (utilise la position GPS et la ville)
- DIVERSITÉ OBLIGATOIRE : mélange OBLIGATOIREMENT plusieurs types parmi {restaurant, café, bar, musée, galerie, parc, point de vue, activité, atelier, lieu insolite, expérience locale}. Pas plus de 2 lieux de la même catégorie sur 6.
- Pour chaque lieu, écris une phrase émotionnelle "why_fits" ULTRA personnalisée qui explique pourquoi ce lieu correspond au mood (style poétique, court, percutant, en français, à la 2e personne du singulier "tu")
- Privilégie hidden gems, lieux peu touristiques quand pertinent
- Adapte à la météo, l'heure et l'historique
- Toujours répondre via la function call return_mood_places.`;

    const historyStr = history?.length
      ? (isEN ? `Recent user moods: ${history.map(h => h.mood).join(", ")}.` : `Moods récents de l'utilisateur : ${history.map(h => h.mood).join(", ")}.`)
      : "";

    // Xplania brain: inject persistent traveler context (profile + memory + history)
    const travelCtx = await buildTravelContext(supabase, user.id);
    const ctxSnippet = contextToPromptSnippet(travelCtx, isEN ? "en" : "fr");

    const userPrompt = isEN
      ? `Mood sought: "${finalMood}"${free_input ? ` — detail: "${free_input}"` : ""}.
${energy_level !== undefined ? `Desired energy level (0=calm, 100=energetic): ${energy_level}.` : ""}
${lat && lng ? `Current position: ${lat}, ${lng}.` : city_hint ? `City: ${city_hint}.` : ""}
${weather ? `Weather: ${weather}.` : ""}
${time_of_day ? `Moment: ${time_of_day}.` : ""}
${budget ? `Budget: ${budget}.` : ""}
${historyStr}
Give 6 DIVERSE places/experiences (at least 4 different categories) perfectly suited. Include at least 1 hidden_gem and at least 1 unusual place. Reply in ENGLISH.`
      : `Mood recherché : "${finalMood}"${free_input ? ` — précision: "${free_input}"` : ""}.
${energy_level !== undefined ? `Niveau d'énergie souhaité (0=calme, 100=énergique): ${energy_level}.` : ""}
${lat && lng ? `Position actuelle: ${lat}, ${lng}.` : city_hint ? `Ville: ${city_hint}.` : ""}
${weather ? `Météo: ${weather}.` : ""}
${time_of_day ? `Moment: ${time_of_day}.` : ""}
${budget ? `Budget: ${budget}.` : ""}
${historyStr}
Donne 6 lieux/expériences DIVERSIFIÉS (au moins 4 catégories différentes) parfaitement adaptés. Inclus au moins 1 hidden_gem et au moins 1 lieu insolite.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "system", content: ctxSnippet },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_mood_places",
            description: "Retourne 6 lieux adaptés au mood",
            parameters: {
              type: "object",
              properties: {
                places: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      category: { type: "string", enum: ["food", "drink", "culture", "nature", "view", "nightlife", "wellness", "shopping", "activity", "hidden_gem"] },
                      description: { type: "string", description: "Description courte 1-2 phrases factuelles" },
                      why_fits: { type: "string", description: "Phrase émotionnelle perso à la 2e personne du singulier (tu), max 25 mots" },
                      tags: { type: "array", items: { type: "string" } },
                      lat: { type: "number" },
                      lng: { type: "number" },
                      distance_km: { type: "number" },
                      duration_min: { type: "number" },
                      tips: { type: "string", description: "Tip local concret" },
                      hidden_gem: { type: "boolean" },
                      score: { type: "number", description: "0-100 : adéquation au mood" },
                    },
                    required: ["name", "category", "description", "why_fits", "tags", "score"],
                  },
                },
              },
              required: ["places"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_mood_places" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessaye dans 1 min." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { places: [] };
    const places = (args.places || []) as any[];

    // Helper: fetch a real Unsplash image for a place (server-side, with cache).
    const UNSPLASH_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const imgCache = new Map<string, string | null>();
    const fetchImage = async (query: string): Promise<string | null> => {
      if (!UNSPLASH_KEY || !query) return null;
      const key = query.toLowerCase().trim();
      if (imgCache.has(key)) return imgCache.get(key)!;
      try {
        const r = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=portrait&per_page=1&content_filter=high`,
          { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } },
        );
        if (!r.ok) { imgCache.set(key, null); return null; }
        const j = await r.json();
        const url = j.results?.[0]?.urls?.regular || null;
        imgCache.set(key, url);
        return url;
      } catch {
        imgCache.set(key, null);
        return null;
      }
    };

    // Resolve images in parallel (max ~6 places).
    const imageUrls = await Promise.all(
      places.map((p) => {
        const q = `${p.name} ${p.category || finalMood}${city_hint ? " " + city_hint : ""}`.trim();
        return fetchImage(q);
      }),
    );

    // Persist
    const rows = places.map((p, idx) => ({
      user_id: user.id,
      selection_id: selection?.id ?? null,
      mood: finalMood,
      name: p.name,
      category: p.category || null,
      description: p.description || null,
      why_fits: p.why_fits,
      tags: Array.isArray(p.tags) ? p.tags : [],
      lat: typeof p.lat === "number" ? p.lat : null,
      lng: typeof p.lng === "number" ? p.lng : null,
      image_url: imageUrls[idx] || null,
      distance_km: typeof p.distance_km === "number" ? p.distance_km : null,
      duration_min: typeof p.duration_min === "number" ? Math.round(p.duration_min) : null,
      tips: p.tips || null,
      hidden_gem: !!p.hidden_gem,
      score: typeof p.score === "number" ? Math.round(p.score) : 50,
      source: "ai",
      metadata: { surprise },
    }));

    let inserted: any[] = [];
    if (rows.length > 0) {
      const { data: ins, error: insErr } = await supabase.from("mood_places").insert(rows).select();
      if (insErr) console.error("Insert places error:", insErr);
      inserted = ins || [];
    }

    return new Response(JSON.stringify({
      mood: finalMood,
      selection_id: selection?.id,
      places: inserted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mood-recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
