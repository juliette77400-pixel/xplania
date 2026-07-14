import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { getTravelerContextSnippet } from "../_shared/inject-context.ts";
// Intelligent chatbot router: classifies user intent and returns a route or free-mode reply.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "pip-router", subject: __auth.userId, limit: 30, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;


  try {
    const { message, history = [], locale = "fr" } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const isEN = locale === "en";
    const sys = isEN
      ? `You are Pip, Xplania's travel companion. Your job: detect the user's INTENT and route them to the right tool, OR have a short helpful chat. Available intents:
- "carnet" → /carnets (travel journal/notebook)
- "valise" → /guide-valise (packing guide)
- "visa" → /guide-visa (visa/formalities)
- "budget" → /guide-budget
- "mood" → /mood (emotion-based discovery)
- "discover" → /discover (local recos)
- "suivi" → /suivi (live trip tracker)
- "planner" → / (trip planner form)
- "free_explore" → null (user wants to be left alone / explore solo / no suggestions)
- "smalltalk" → null (just chatting)

CRITICAL: If the user says things like "I want to walk alone", "leave me alone", "I just want to explore by myself", "no suggestions", "let me wander" → intent = "free_explore", route = null, reply with a SHORT warm acknowledgement (1 sentence), DO NOT ask any follow-up question, DO NOT push CTAs.

For other intents, reply with 1-2 short sentences and propose the relevant tool. Reply in ENGLISH.`
      : `Tu es Pip, le compagnon de voyage de Xplania. Ton rôle : détecter l'INTENTION de l'utilisateur et l'orienter vers le bon outil, OU avoir une courte conversation utile. Intentions disponibles :
- "carnet" → /carnets (carnet de voyage)
- "valise" → /guide-valise (guide bagage)
- "visa" → /guide-visa (formalités)
- "budget" → /guide-budget
- "mood" → /mood (découverte par émotion)
- "discover" → /discover (recommandations locales)
- "suivi" → /suivi (suivi de voyage live)
- "planner" → / (planificateur)
- "free_explore" → null (l'utilisateur veut être tranquille / explorer seul / pas de suggestions)
- "smalltalk" → null (simple échange)

CRITIQUE : Si l'utilisateur dit des choses comme « je veux me promener seule », « laisse-moi tranquille », « je veux juste explorer par moi-même », « pas de suggestions », « laisse-moi flâner » → intent = "free_explore", route = null, réponds par UNE phrase courte et chaleureuse d'acceptation, NE POSE AUCUNE question de relance, NE POUSSE AUCUN CTA.

Pour les autres intentions, réponds en 1-2 phrases courtes et propose l'outil pertinent. Réponds en FRANÇAIS.`;

    const messages = [
      { role: "system", content: sys },
      ...history.slice(-6).map((m: any) => ({ role: m.role, content: String(m.content || "").slice(0, 800) })),
      { role: "user", content: message.slice(0, 1000) },
    ];

    const tools = [{
      type: "function",
      function: {
        name: "respond",
        description: "Return the routing decision and the chat reply.",
        parameters: {
          type: "object",
          properties: {
            intent: { type: "string", enum: ["carnet", "valise", "visa", "budget", "mood", "discover", "suivi", "planner", "free_explore", "smalltalk"] },
            route: { type: ["string", "null"], description: "URL path to navigate to, or null." },
            reply: { type: "string", description: "Short chat message to display." },
            cta_label: { type: ["string", "null"], description: "Label for the CTA button, or null if free_explore/smalltalk." },
          },
          required: ["intent", "reply"],
          additionalProperties: false,
        },
      },
    }];

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools,
        tool_choice: { type: "function", function: { name: "respond" } },
      }),
    });
    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("pip-router AI error", r.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = { intent: "smalltalk", reply: isEN ? "Got it." : "D'accord." };
    try { parsed = JSON.parse(call?.function?.arguments || "{}"); } catch {}
    // Enforce: free_explore must NOT have CTA/route
    if (parsed.intent === "free_explore") {
      parsed.route = null;
      parsed.cta_label = null;
    }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("pip-router error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
