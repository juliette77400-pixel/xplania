import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { getTravelerContextSnippet } from "../_shared/inject-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "budget-tips", subject: __auth.userId, limit: 20, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;


  try {
    const {
      destination = "Paris",
      totalBudget = 800,
      days = 5,
      travelers = 1,
      categories = [],
      locale = "fr",
      departureDate = "",
      returnDate = "",
      travelStyle = "",
      tripTypes = [],
      spendingPriorities = [],
      accommodationStanding = "",
      organization = "",
      rhythm = "",
    } = await req.json();

    const isEN = locale === "en";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const breakdown = (categories as Array<{ key: string; planned: number; spent: number }>)
      .map((c) => `${c.key}: planned €${c.planned}, spent €${c.spent}`)
      .join(" | ");

    const traveler = `${travelers} traveler${travelers > 1 ? "s" : ""}`;
    const styleBits = [
      tripTypes?.length ? `trip type: ${(tripTypes as string[]).join(", ")}` : "",
      spendingPriorities?.length ? `priorities: ${(spendingPriorities as string[]).join(", ")}` : "",
      accommodationStanding ? `accommodation standing: ${accommodationStanding}` : "",
      organization ? `organization: ${organization}` : "",
      rhythm ? `rhythm: ${rhythm}` : "",
      travelStyle ? `style: ${travelStyle}` : "",
    ].filter(Boolean).join(" | ");

    const dateBits = departureDate ? `Dates: ${departureDate}${returnDate ? ` → ${returnDate}` : ""}` : "";

    const guardrail = isEN
      ? `Only suggest saving tips that are specific, verifiable, and directly relevant to the user's destination and budget categories. Avoid generic advice. Each tip MUST reference a real place, service, transport card, market, district, chain or local practice you genuinely know exists in ${destination}. If you cannot ground a tip in a verifiable local reality, do NOT include it. Prefer fewer, well-sourced tips over filler. Tailor tone and content to the traveler profile and current budget allocation.`
      : `Ne propose que des astuces spécifiques, vérifiables et directement utiles à la destination et aux postes budgétaires de l'utilisateur. Évite les conseils génériques. Chaque astuce DOIT mentionner un vrai lieu, service, pass transport, marché, quartier, enseigne ou pratique locale que tu connais réellement à ${destination}. Si tu ne peux pas ancrer une astuce dans une réalité locale vérifiable, NE l'inclus PAS. Mieux vaut moins d'astuces, mais solides. Adapte le ton et le contenu au profil voyageur et à la répartition budgétaire actuelle.`;

    const travelerCtx = await getTravelerContextSnippet(__auth.userId, isEN ? "en" : "fr");

    const system = isEN
      ? `You are a frugal local guide who knows ${destination} intimately. You write 3 to 5 HYPER-LOCAL money-saving tips for THIS specific traveler. ${guardrail} Each tip 1–2 sentences. Reply ONLY via the "saving_tips" tool. Output in ENGLISH.\n\n${travelerCtx}`
      : `Tu es un guide local frugal qui connaît parfaitement ${destination}. Tu rédiges 3 à 5 astuces d'économie HYPER-LOCALES pour CE voyageur précis. ${guardrail} Chaque astuce fait 1 à 2 phrases. Réponds UNIQUEMENT via le tool "saving_tips". En FRANÇAIS.\n\n${travelerCtx}`;

    const user = isEN
      ? `Destination: ${destination}
${dateBits}
Total budget: €${totalBudget} (${traveler}, ${days} days)
Traveler profile: ${styleBits || "n/a"}
Current breakdown: ${breakdown || "none yet"}

Generate 3 to 5 saving tips specifically useful for THIS trip and profile.`
      : `Destination : ${destination}
${dateBits}
Budget total : ${totalBudget} € (${traveler}, ${days} jours)
Profil voyageur : ${styleBits || "n/c"}
Répartition actuelle : ${breakdown || "aucune pour l'instant"}

Génère 3 à 5 astuces d'économie utiles pour CE voyage et ce profil précisément.`;

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
                        body: { type: "string", description: "1-2 sentence practical tip with a real local reference" },
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
