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
      destination = "Paris",
      totalBudget = 800,
      days = 5,
      travelers = 1,
      categories = [],
      locale = "fr",
    } = await req.json();

    const isEN = locale === "en";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const breakdown = (categories as Array<{ key: string; planned: number; spent: number }>)
      .map((c) => `${c.key}: planned €${c.planned}, spent €${c.spent}`)
      .join(" | ");

    const system = isEN
      ? `You are a frugal local guide who knows ${destination} intimately. You write 3 to 5 HYPER-LOCAL money-saving tips. Each tip must reference a real local name (pass, card, market, district, chain, app) when relevant. NEVER write generic advice like "cook at home" or "set a budget". Each tip 1–2 sentences. Reply ONLY via the "saving_tips" tool. Output in ENGLISH.`
      : `Tu es un guide local frugal qui connaît parfaitement ${destination}. Tu rédiges 3 à 5 astuces d'économie HYPER-LOCALES. Chaque astuce doit mentionner un nom local réel (pass, carte, marché, quartier, enseigne, appli) quand c'est pertinent. JAMAIS de conseils génériques type "cuisiner chez soi" ou "fixer un budget". Chaque astuce fait 1 à 2 phrases. Réponds UNIQUEMENT via le tool "saving_tips". En FRANÇAIS.`;

    const user = isEN
      ? `Destination: ${destination}
Total budget: €${totalBudget}
Duration: ${days} days, ${travelers} traveler(s)
Current breakdown: ${breakdown || "none yet"}

Generate 3 to 5 saving tips specifically useful for THIS trip.`
      : `Destination : ${destination}
Budget total : ${totalBudget} €
Durée : ${days} jours, ${travelers} voyageur(s)
Répartition actuelle : ${breakdown || "aucune pour l'instant"}

Génère 3 à 5 astuces d'économie utiles pour CE voyage précisément.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "saving_tips",
              description: "Return localized money-saving tips for the trip.",
              parameters: {
                type: "object",
                properties: {
                  tips: {
                    type: "array",
                    minItems: 3,
                    maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short title (max 6 words)" },
                        body: { type: "string", description: "1-2 sentence practical tip with a local reference" },
                        category: { type: "string", enum: ["accommodation", "localTransport", "activities", "food", "shopping", "extras"] },
                      },
                      required: ["title", "body", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "saving_tips" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      console.error("AI gateway error", response.status, txt);
      throw new Error(`AI gateway ${response.status}`);
    }

    const data = await response.json();
    const tool = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tool?.function?.arguments) throw new Error("no_structured_output");
    const parsed = JSON.parse(tool.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("budget-tips error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
