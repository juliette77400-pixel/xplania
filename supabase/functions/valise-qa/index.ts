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
      startDate = "",
      endDate = "",
      luggage = "",
      tripType = "",
      activities = [],
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
          ? `The user's FIRST NAME is "${firstName}". Use it naturally about once every 3-4 sentences. Vary forms. Never write "{{name}}".`
          : `Le PRÉNOM de l'utilisateur est "${firstName}". Utilise-le naturellement environ 1 fois toutes les 3-4 phrases. Varie les formules. N'écris JAMAIS "{{name}}".`)
      : (isEN
          ? `You don't know the user's first name — don't invent one.`
          : `Tu ne connais pas le prénom — n'en invente pas.`);

    const languageRule = isEN
      ? `LANGUAGE: Reply in ENGLISH. Always address the user as "you", friendly and informal.`
      : `LANGUE: Réponds en FRANÇAIS. Tutoie TOUJOURS l'utilisateur. N'utilise JAMAIS "vous".`;

    const structureRule = isEN
      ? `LENGTH & STRUCTURE:
- Short follow-ups: 3-6 warm sentences.
- For packing summaries, outfit advice, cultural tips or weather-driven adaptations: reply LONG and STRUCTURED with these sections (only the ones that apply):
  🧳 Packing essentials — split by category (clothes, hygiene, docs, tech, health), concrete items with quantities.
  🌤️ Weather adaptation — what to add / remove based on conditions.
  👗 Outfit ideas — 2-3 complete looks (pieces, colors, materials, occasion).
  🌍 Cultural tips — dress code, customs, useful local words.
  🛡️ Safety (only if solo trip) — concrete tips for solo travellers.
- Always end with one practical actionable tip.`
      : `LONGUEUR & STRUCTURE:
- Questions courtes : 3-6 phrases chaleureuses.
- Pour les résumés valise, tenues, conseils culturels ou adaptations météo : réponds LONG et STRUCTURÉ avec ces sections (seulement celles qui s'appliquent) :
  🧳 Essentiels valise — par catégorie (vêtements, hygiène, documents, tech, santé), items concrets avec quantités.
  🌤️ Adaptation météo — ce qu'on ajoute / retire selon les conditions.
  👗 Idées de tenues — 2-3 looks complets (pièces, couleurs, matières, occasion).
  🌍 Conseils culturels — dress code, coutumes, mots utiles.
  🛡️ Sécurité (si voyage solo) — conseils concrets pour voyageurs en solo.
- Termine toujours par un conseil concret et actionnable.`;

    const actList = Array.isArray(activities) ? activities.join(", ") : String(activities || "");
    const dateLine = startDate && endDate ? `${startDate} → ${endDate}` : (duration || "(unknown)");

    const context = `USER
First name: ${firstName || "(unknown)"}

TRIP
Destination: ${destination || "(unknown)"}
Dates / duration: ${dateLine}
Luggage: ${luggage || "(unknown)"}
Trip type: ${tripType || "(unknown)"}
Activities: ${actList || "(unknown)"}`;

    const system = isEN
      ? `You are Pip, Xplania's personal packing copilot. Warm, like a friend who travels a lot. Never condescending. You help with packing lists, weather adaptation, outfit ideas, cultural tips and solo-travel safety advice.

${languageRule}

${nameLine}

${structureRule}

Be concrete and practical — no generic advice. Avoid repeating the same tips across sessions: vary your angles. Occasional emoji is fine 🎒.

CONTEXT
${context}`
      : `Tu es Pip, le copilote valise personnel de Xplania. Chaleureux, comme un ami qui voyage beaucoup. Jamais condescendant. Tu aides sur la valise, l'adaptation météo, les idées de tenues, les conseils culturels et les conseils sécurité solo.

${languageRule}

${nameLine}

${structureRule}

Sois concret et pratique — pas de conseils génériques. Évite de répéter les mêmes conseils d'une session à l'autre : varie les angles. Un emoji de temps en temps c'est ok 🎒.

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
    console.error("valise-qa error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
