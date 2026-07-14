import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "discover-enrich", subject: __auth.userId, limit: 30, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;


  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { placeIds, contextHint } = await req.json();
    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return new Response(JSON.stringify({ enriched: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: places, error } = await supa.from("places")
      .select("id,name,category,subcategory,address,tags").in("id", placeIds.slice(0, 12)).is("why_fits", null);
    if (error) throw error;
    if (!places || places.length === 0) {
      return new Response(JSON.stringify({ enriched: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `Tu es un curator local expert. Pour chaque lieu, écris en français une description immersive courte (1 phrase, max 18 mots), une raison émotionnelle "why_fits" (1 phrase, max 16 mots, commence par un verbe ou "Pour"), 3 tags lifestyle (ex: cosy, vue, brunch, hidden, romantique, local, instagrammable), un tip insider concret (max 14 mots), et indique si c'est un hidden gem. Reste authentique, jamais touristique générique.${contextHint ? " Contexte: " + contextHint : ""}`;

    const tool = {
      type: "function",
      function: {
        name: "enrich_places",
        description: "Enrichit chaque lieu avec une description immersive personnalisée",
        parameters: {
          type: "object",
          properties: {
            places: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  description: { type: "string" },
                  why_fits: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  tips: { type: "string" },
                  hidden_gem: { type: "boolean" },
                  score: { type: "number" },
                },
                required: ["id", "description", "why_fits", "tags", "tips", "hidden_gem", "score"],
                additionalProperties: false,
              },
            },
          },
          required: ["places"],
          additionalProperties: false,
        },
      },
    };

    const userPrompt = "Lieux à enrichir:\n" + places.map((p) =>
      `- id=${p.id} | ${p.name} (${p.category}${p.subcategory ? "/" + p.subcategory : ""})${p.address ? " — " + p.address : ""}`
    ).join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "enrich_places" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA insuffisants" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI gateway", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await aiResp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return new Response(JSON.stringify({ enriched: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const parsed = JSON.parse(args);

    let count = 0;
    for (const item of parsed.places || []) {
      const { error: upErr } = await supa.from("places").update({
        description: item.description,
        why_fits: item.why_fits,
        tags: item.tags,
        tips: item.tips,
        hidden_gem: item.hidden_gem,
        score: Math.round(item.score),
      }).eq("id", item.id);
      if (!upErr) count++;
    }

    return new Response(JSON.stringify({ enriched: count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("discover-enrich", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
