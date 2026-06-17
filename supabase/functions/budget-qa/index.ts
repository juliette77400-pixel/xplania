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
      firstName = "",
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    type Cat = { key: string; planned: number; spent: number };
    const cats = categories as Cat[];
    const breakdown = cats
      .map((c) => {
        const remaining = (Number(c.planned) || 0) - (Number(c.spent) || 0);
        return `${c.key}: planned €${c.planned}, spent €${c.spent}, remaining €${remaining}`;
      })
      .join(" | ");

    const totalSpent = (expenses as Array<{ amount: number }>).reduce(
      (s, e) => s + (Number(e.amount) || 0),
      0
    );
    const totalRemaining = (Number(totalBudget) || 0) - totalSpent;

    const expensesList = (expenses as Array<{ amount: number; category?: string; label?: string; date?: string }>)
      .slice(-20)
      .map((e) => `${e.date || ""} ${e.category || ""} €${e.amount}${e.label ? ` (${e.label})` : ""}`.trim())
      .join(" ; ") || "none";

    const styleBits = [
      tripTypes?.length ? `trip type: ${(tripTypes as string[]).join(", ")}` : "",
      spendingPriorities?.length ? `priorities: ${(spendingPriorities as string[]).join(", ")}` : "",
      accommodationStanding ? `accommodation: ${accommodationStanding}` : "",
      organization ? `organization: ${organization}` : "",
      rhythm ? `rhythm: ${rhythm}` : "",
    ].filter(Boolean).join(" | ");

    const today = new Date().toISOString().slice(0, 10);

    const context = `USER
First name: ${firstName || "(unknown)"}

TRIP
Destination: ${destination}
Dates: ${departureDate || "n/a"}${returnDate ? ` → ${returnDate}` : ""}
Duration: ${days} days
Travelers: ${travelers}
Profile: ${styleBits || "n/a"}

BUDGET
Total budget: €${totalBudget}
Total spent: €${Math.round(totalSpent)}
Total remaining: €${Math.round(totalRemaining)}
Per category: ${breakdown || "n/a"}

EXPENSES (recent)
${expensesList}

CURRENT DATE: ${today}`;

    const isEN = String(locale).startsWith("en");
    const nameLine = firstName
      ? (isEN
          ? `The user's FIRST NAME is "${firstName}". Use it naturally in your reply — opener like "Hey ${firstName}!", "Got it ${firstName}", "Honestly ${firstName}…", or mid-sentence ("…and ${firstName}, here's the thing"). Vary the form, don't paste it in every sentence, but make sure it appears at least once when it feels natural. Never write "{{name}}" literally.`
          : `Le PRÉNOM de l'utilisateur est "${firstName}". Utilise-le de façon naturelle dans ta réponse — en intro ("Hey ${firstName} !", "Alors ${firstName}…", "Franchement ${firstName}…") ou en milieu de phrase ("…et tu sais ${firstName}, le truc c'est…"). Varie les formulations, ne le répète pas à chaque phrase, mais glisse-le au moins une fois quand c'est naturel. N'écris JAMAIS "{{name}}" littéralement.`)
      : (isEN
          ? `You don't know the user's first name — don't invent one and don't write "{{name}}".`
          : `Tu ne connais pas le prénom de l'utilisateur — n'en invente pas et n'écris jamais "{{name}}".`);

    const languageRule = isEN
      ? `ABSOLUTE LANGUAGE RULE: Reply in ENGLISH. Always address the user as "you" in a friendly, informal way (never corporate). Never use French.`
      : `RÈGLE DE LANGUE ABSOLUE: Réponds en FRANÇAIS. Tutoie TOUJOURS l'utilisateur ("tu", "ton", "ta", "tes", "toi"). N'utilise JAMAIS "vous", "votre", "vos" — même par politesse. Si tu te surprends à écrire "vous", remplace-le immédiatement par "tu".

Exemples corrects: "Oui, 100 € c'est un bon budget pour toi", "Pense à réserver tes billets", "Si tu dépasses…", "Ton plan initial prévoyait 143 €".
Exemples INTERDITS: "vous pouvez", "votre plan", "vos billets", "si vous dépassez".`;

    const system = `Tu es Pip, le copilote de voyage personnel de Xplania. Chaleureux, encourageant, tu parles comme un pote qui a beaucoup voyagé — pas comme un service client. Tu es enthousiaste, tu rassures, tu donnes des conseils concrets sans stresser l'utilisateur.

${languageRule}

${nameLine}

Tu as accès au contexte complet du voyage : prénom, destination, dates et durée, nombre de voyageurs, répartition du budget par catégorie, dépenses déjà loguées, restant par catégorie.

Tu peux répondre à : faisabilité du budget, rythme quotidien de dépenses, prix locaux et coût de la vie à destination, options de transport et coûts sur place, conseils food (restos locaux, marchés, street food), activités gratuites ou pas chères, change de devises, comment répartir les frais entre voyageurs, que faire en cas de dépassement, conseils voyage liés au budget.

Tu ne dis JAMAIS que tu ne peux pas répondre. Si tu n'es pas sûr à 100 %, dis-le honnêtement et donne quand même ta meilleure estimation avec contexte. Réponses courtes et chaleureuses (3-6 phrases), pas de murs de bullet points : écris comme si tu textais à un pote. Un emoji de temps en temps pour vivre, sans en abuser ✈️.

CONTEXTE
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
