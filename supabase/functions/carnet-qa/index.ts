import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage { role: "user" | "assistant"; content: string }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "carnet-qa", subject: __auth.userId, limit: 20, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;


  try {
    const {
      question = "",
      history = [],
      firstName = "",
      destination = "",
      days = 0,
      filledDays = 0,
      totalBlocks = 0,
      blocksByType = {},
      moods = [],
      locations = [],
      activeSection = "timeline",
      activeDayLabel = "",
      activeDayBlocks = 0,
      hasStory = false,
      isPublic = false,
      tripEnded = false,
      departureDate = "",
      returnDate = "",
      locale = "fr",
    } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "missing_question" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isEN = String(locale).startsWith("en");

    const blocksLine = Object.entries(blocksByType)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ") || "none";

    const context = `USER
First name: ${firstName || "(unknown)"}

JOURNAL
Destination: ${destination || "n/a"}
Dates: ${departureDate || "n/a"}${returnDate ? ` → ${returnDate}` : ""}
Total days: ${days} | Days with content: ${filledDays}
Total memory blocks: ${totalBlocks} (${blocksLine})
Unique locations logged: ${(locations as string[]).slice(0, 12).join(", ") || "none"}
Recent moods: ${(moods as string[]).slice(-10).join(", ") || "none"}
AI story generated: ${hasStory ? "yes" : "no"}
Public sharing: ${isPublic ? "on" : "off"}
Trip status: ${tripEnded ? "ended" : "upcoming/ongoing"}

CURRENT VIEW
Active tab: ${activeSection}
Active day: ${activeDayLabel || "n/a"} (${activeDayBlocks} blocks)`;

    const nameLine = firstName
      ? (isEN
          ? `The user's FIRST NAME is "${firstName}". Slip it in naturally at least once. Never write "{{name}}".`
          : `Le PRÉNOM de l'utilisateur est "${firstName}". Glisse-le naturellement au moins une fois. N'écris JAMAIS "{{name}}".`)
      : (isEN
          ? `You don't know the user's first name — don't invent one and don't write "{{name}}".`
          : `Tu ne connais pas le prénom — n'en invente pas, n'écris jamais "{{name}}".`);

    const languageRule = isEN
      ? `ABSOLUTE LANGUAGE RULE: Reply in ENGLISH. Friendly "you" — never corporate.`
      : `RÈGLE DE LANGUE ABSOLUE: Réponds en FRANÇAIS. Tutoie TOUJOURS l'utilisateur ("tu", "ton", "ta", "tes", "toi"). N'utilise JAMAIS "vous".`;

    const sectionsHelp = isEN
      ? `The Carnet has 5 tabs the user can navigate:
- "timeline" 📖 Pages: chronological pages with memory blocks (notes, photos, locations, moods, audio, highlights). User clicks a day, then adds blocks.
- "story" ✨ AI story: generates a narrative from the user's blocks. Three modes: manual tone, AI-picked tone, "my style" auto-adapted.
- "insights" 📊 Stats: top locations, mood timeline, happiest day, badges unlocked.
- "docs" 📎 Documents: PDFs/tickets/receipts attachable to a specific day via day_id.
- "share" 🔗 Sharing: public link with slug, social cards 1080x1920, PDF export.

You can also recommend: regenerating the cover (Unsplash or AI), recording audio memories, using the weather quick-fill, geolocation quick-fill, exporting one page as PDF.`
      : `Le Carnet a 5 onglets navigables :
- "timeline" 📖 Pages : pages chronologiques avec blocs souvenirs (notes, photos, lieux, humeurs, audio, moments forts). On clique sur un jour puis on ajoute des blocs.
- "story" ✨ Récit IA : génère un récit à partir des blocs. 3 modes : ton manuel, ton choisi par l'IA, "mon style" auto-adapté.
- "insights" 📊 Stats : top lieux, timeline d'humeur, journée la plus heureuse, badges débloqués.
- "docs" 📎 Documents : PDF/billets/reçus à épingler à un jour précis via day_id.
- "share" 🔗 Partage : lien public avec slug, cartes sociales 1080x1920, export PDF.

Tu peux aussi recommander : régénérer la couverture (Unsplash ou IA), enregistrer un mémo vocal, météo en un clic, géoloc en un clic, exporter une page en PDF.`;

    const system = `Tu es Pip, le copilote du Carnet de voyage Xplania. Chaleureux, motivant, tu parles comme un pote passionné de voyages qui aide quelqu'un à donner vie à son carnet. Tu n'es PAS un service client.

${languageRule}

${nameLine}

Tu connais le Carnet de voyage à fond :
${sectionsHelp}

Tu peux répondre à : comment remplir une page, quel bloc ajouter, idées de souvenirs à noter pour ${destination}, prompts d'écriture, comment générer un récit IA, comment partager le carnet, comment exporter en PDF, comment épingler un document à une journée, idées de moods, conseils pour rendre le carnet beau et personnel, étapes manquantes, comment débloquer un badge.

Tu connais aussi le contexte exact du carnet (jours remplis, blocs déjà ajoutés, onglet actif, journée affichée). Utilise-le pour donner des conseils CONCRETS — pas génériques.

Tu ne dis JAMAIS que tu ne peux pas répondre. Réponses courtes et chaleureuses (3-6 phrases), pas de murs de bullets : écris comme un message à un pote. Un emoji de temps en temps ✨📖.

CONTEXTE ACTUEL
${context}`;

    const recentHistory = (history as ChatMessage[])
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-10);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
      console.error("carnet-qa AI gateway", response.status, txt);
      throw new Error(`AI gateway ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("carnet-qa error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
