import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      question = "",
      history = [],
      destination = "Paris",
      totalBudget = 0,
      days = 0,
      travelers = 1,
      categories = [],
      expenses = [],
      locale = "fr",
      departureDate = "",
      returnDate = "",
      tripTypes = [],
      spendingPriorities = [],
      accommodationStanding = "",
      organization = "",
      rhythm = "",
    } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "missing_question" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isEN = locale === "en";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const breakdown = (categories as Array<{ key: string; planned: number; spent: number }>)
      .map((c) => `${c.key}: planned €${c.planned}, spent €${c.spent}`)
      .join(" | ");

    const totalSpent = (expenses as Array<{ amount: number }>).reduce(
      (s, e) => s + (Number(e.amount) || 0),
      0
    );

    const styleBits = [
      tripTypes?.length ? `trip type: ${(tripTypes as string[]).join(", ")}` : "",
      spendingPriorities?.length ? `priorities: ${(spendingPriorities as string[]).join(", ")}` : "",
      accommodationStanding ? `accommodation: ${accommodationStanding}` : "",
      organization ? `organization: ${organization}` : "",
      rhythm ? `rhythm: ${rhythm}` : "",
    ].filter(Boolean).join(" | ");

    const context = isEN
      ? `Destination: ${destination}
Dates: ${departureDate || "n/a"}${returnDate ? ` → ${returnDate}` : ""}
Duration: ${days} days, ${travelers} traveler(s)
Total budget: €${totalBudget}
Total spent so far: €${Math.round(totalSpent)}
Breakdown: ${breakdown || "n/a"}
Profile: ${styleBits || "n/a"}`
      : `Destination : ${destination}
Dates : ${departureDate || "n/c"}${returnDate ? ` → ${returnDate}` : ""}
Durée : ${days} jours, ${travelers} voyageur(s)
Budget total : ${totalBudget} €
Dépensé jusqu'ici : ${Math.round(totalSpent)} €
Répartition : ${breakdown || "n/c"}
Profil : ${styleBits || "n/c"}`;

    const system = isEN
      ? `You are Pip, Xplania's budget copilot for ${destination}. Answer the user's budget question using the trip context below. Be concrete, hyper-local, and reference real local prices, transit cards, neighborhoods, markets or services when relevant. If you cannot verify something, say so honestly. Keep answers short (3-6 sentences max), structured, and actionable. Reply in ENGLISH.

TRIP CONTEXT
${context}`
      : `Tu es Pip, le copilote budget Xplania pour ${destination}. Réponds à la question budget de l'utilisateur en t'appuyant sur le contexte voyage ci-dessous. Sois concret, hyper-local, et mentionne de vrais prix, pass transport, quartiers, marchés ou services locaux quand c'est pertinent. Si tu ne peux pas vérifier une info, dis-le honnêtement. Réponses courtes (3 à 6 phrases max), structurées, actionnables. Réponds en FRANÇAIS.

CONTEXTE VOYAGE
${context}`;

    const recentHistory = (history as ChatMessage[])
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-10);

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
          ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: question },
        ],
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
    const answer = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("budget-qa error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
