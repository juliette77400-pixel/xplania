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
      destination = "",
      nationality = "France",
      tripType = "",
      duration = "",
      locale = "fr",
    } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "missing_question" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isEN = String(locale).startsWith("en");

    const nameLine = firstName
      ? (isEN
          ? `The user's FIRST NAME is "${firstName}". Use it naturally in your reply — opener like "Hey ${firstName}!", "Got it ${firstName}", or mid-sentence. Vary the form, don't repeat in every sentence. Never write "{{name}}" literally.`
          : `Le PRÉNOM de l'utilisateur est "${firstName}". Utilise-le de façon naturelle ("Hey ${firstName} !", "Alors ${firstName}…") ou en milieu de phrase. Varie les formulations. N'écris JAMAIS "{{name}}".`)
      : (isEN
          ? `You don't know the user's first name — don't invent one and don't write "{{name}}".`
          : `Tu ne connais pas le prénom de l'utilisateur — n'en invente pas et n'écris jamais "{{name}}".`);

    const languageRule = isEN
      ? `ABSOLUTE LANGUAGE RULE: Reply in ENGLISH. Always address the user as "you" — friendly, informal, never corporate.`
      : `RÈGLE DE LANGUE ABSOLUE: Réponds en FRANÇAIS. Tutoie TOUJOURS l'utilisateur ("tu", "ton", "ta", "tes", "toi"). N'utilise JAMAIS "vous", "votre", "vos".`;

    const neutralRule = isEN
      ? `NEUTRALITY: Never take political or geopolitical sides. When citing safety levels or restrictions, attribute them to "French authorities" / official advisories (diplomatie.gouv.fr). Never explain WHY a country is dangerous in political terms.`
      : `NEUTRALITÉ: Ne prends JAMAIS parti politiquement ou géopolitiquement. Quand tu cites un niveau de sécurité ou une restriction, attribue-le aux "autorités françaises" (diplomatie.gouv.fr). N'explique JAMAIS pourquoi un pays est dangereux en termes politiques.`;

    const disclaimerRule = isEN
      ? `MANDATORY DISCLAIMER: End EVERY reply about visas, entry requirements, safety, or formalities with a small line: "⚠️ Always verify on the official embassy site (diplomatie.gouv.fr) before booking."`
      : `DISCLAIMER OBLIGATOIRE: Termine CHAQUE réponse sur les visas, formalités d'entrée, sécurité ou démarches par une petite ligne: "⚠️ Vérifie toujours sur le site officiel (diplomatie.gouv.fr) avant de réserver."`;

    const context = `USER
First name: ${firstName || "(unknown)"}

TRIP
Destination: ${destination || "(unknown)"}
Passport / nationality: ${nationality}
Trip type: ${tripType || "(unknown)"}
Stay duration: ${duration || "(unknown)"}`;

    const system = isEN
      ? `You are Pip, Xplania's personal visa & travel-formalities copilot. Warm, clear, jargon-free, reassuring for first-time travellers — never condescending. You help with visas, entry requirements, safety advisories, admin steps, and currency basics.

${languageRule}

${nameLine}

${neutralRule}

${disclaimerRule}

You NEVER say you can't answer. If you're not 100% sure, say so honestly and still give your best estimate with context. Keep replies short and warm (3-6 sentences). Write like you're texting a friend. Occasional emoji is fine ✈️.

CONTEXT
${context}`
      : `Tu es Pip, le copilote personnel de Xplania pour les visas et formalités de voyage. Chaleureux, clair, sans jargon, rassurant pour les premiers voyages — jamais condescendant. Tu aides sur visas, formalités d'entrée, sécurité, démarches admin et bases de change.

${languageRule}

${nameLine}

${neutralRule}

${disclaimerRule}

Tu ne dis JAMAIS que tu ne peux pas répondre. Si tu n'es pas sûr à 100%, dis-le honnêtement et donne ta meilleure estimation. Réponses courtes et chaleureuses (3-6 phrases), comme si tu textais à un pote. Un emoji de temps en temps ✈️.

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
    const answer = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("visa-qa error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
