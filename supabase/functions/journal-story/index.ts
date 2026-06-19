// Generate an immersive trip story from journal data using Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TONE_PROMPTS_FR: Record<string, string> = {
  storytelling: "Écris un récit narratif immersif et engageant à la première personne, comme un chapitre de roman de voyage.",
  poetic: "Écris un texte poétique, lyrique, riche en métaphores et en images sensorielles.",
  fun: "Écris un récit fun, décontracté, plein d'humour et d'anecdotes amusantes.",
  documentary: "Écris dans un style documentaire factuel, précis et descriptif, façon reportage.",
};

const TONE_PROMPTS_EN: Record<string, string> = {
  storytelling: "Write an immersive, engaging first-person narrative, like a chapter of a travel novel.",
  poetic: "Write a poetic, lyrical text, rich in metaphors and sensory imagery.",
  fun: "Write a fun, casual story full of humor and amusing anecdotes.",
  documentary: "Write in a factual, precise documentary style, reportage-like.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, days, tone = "storytelling", mode, rawText, locale = "fr", styleProfile = null } = await req.json();
    const isEN = locale === "en";

    if (mode === "enhance-block" && rawText) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
      const sys = isEN
        ? "You are a travel writer. Rewrite short raw notes into evocative, sensory and fluid text. Max 80 words, no title, no markdown. Reply in ENGLISH."
        : "Tu es un écrivain de voyage. Tu reformules de courtes notes brutes en un texte évocateur, sensoriel et fluide. Garde le sens, ajoute la magie. Maximum 80 mots, sans titre, sans markdown.";
      const usr = isEN
        ? `Trip context: ${destination || "(unspecified)"}\n\nRaw note:\n${rawText}\n\nRewrite in a more immersive and beautiful way, first person. ENGLISH only.`
        : `Contexte voyage: ${destination || "(non précisé)"}\n\nNote brute:\n${rawText}\n\nRéécris cette note de façon plus immersive et belle, à la première personne.`;
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("enhance-block error", r.status, t);
        return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await r.json();
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!destination || !Array.isArray(days)) {
      return new Response(JSON.stringify({ error: "destination & days required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const useAutoStyle = (mode === "auto" || tone === "auto") && styleProfile && typeof styleProfile === "object";
    const TONE_PROMPTS = isEN ? TONE_PROMPTS_EN : TONE_PROMPTS_FR;
    const toneInstruction = useAutoStyle
      ? (isEN
          ? `Write in the AUTHOR'S OWN STYLE described here: ${JSON.stringify(styleProfile)}. Match their vocabulary register, sentence length, emotional tone, and reuse some of their signature words naturally. Do NOT sound generic. It must read as if written by this person.`
          : `Écris dans le STYLE PROPRE DE L'AUTEUR décrit ici : ${JSON.stringify(styleProfile)}. Respecte son registre de vocabulaire, la longueur de ses phrases, sa tonalité émotionnelle, et réutilise naturellement quelques-uns de ses mots signature. Ne sonne PAS générique. Ça doit se lire comme écrit par cette personne.`)
      : (TONE_PROMPTS[tone] ?? TONE_PROMPTS.storytelling);

    const journalSummary = days
      .map((d: any, i: number) => {
        const blocks = (d.blocks || []).map((b: any) => {
          const c = b.content || {};
          if (b.type === "note") return `Note: ${c.text || ""}`;
          if (b.type === "mood") return `${isEN ? "Mood" : "Humeur"}: ${c.emoji || ""} (${c.score ?? "?"}/5)`;
          if (b.type === "location") return `${isEN ? "Place" : "Lieu"}: ${c.name || ""}`;
          if (b.type === "highlight") return `⭐ ${isEN ? "Highlight" : "Moment fort"}: ${c.text || ""}`;
          if (b.type === "photo") return `Photo: ${c.caption || (isEN ? "(no caption)" : "(sans légende)")}`;
          return "";
        }).filter(Boolean).join(" | ");
        return `${isEN ? "Day" : "Jour"} ${i + 1} (${d.date}) — ${d.title || ""}\n${blocks || (isEN ? "(no memory)" : "(pas de souvenir)")}`;
      })
      .join("\n\n");

    const prompt = isEN
      ? `Here is my trip to ${destination}.\n\n${journalSummary}\n\nTransform this into an immersive narrative. ${toneInstruction} Around 400-600 words. No markdown headers, smooth paragraphs. ENGLISH only.`
      : `Voici mon voyage à ${destination}.\n\n${journalSummary}\n\nTransforme cela en un récit immersif. ${toneInstruction} Garde une longueur d'environ 400-600 mots. Pas de titres markdown, juste un texte fluide en paragraphes.`;

    const sysStory = isEN
      ? "You are a talented travel writer who transforms raw memories into captivating stories. Reply in ENGLISH only."
      : "Tu es un écrivain de voyage talentueux qui transforme des souvenirs bruts en récits captivants.";

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sysStory }, { role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Limite atteinte, réessaie dans un instant." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("journal-story error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
