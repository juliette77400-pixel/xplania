// Fetches up-to-date, AI-synthesized info from official authorities
// (France-Diplomatie, Institut Pasteur, OMS / WHO) for a given destination.
// Returns structured JSON with a "lastChecked" timestamp + source attributions.
import { requireAuth } from "../_shared/require-auth.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReqBody {
  destination?: string;
  locale?: "fr" | "en";
}

const SYSTEM_FR = `Tu es un assistant qui synthétise UNIQUEMENT à partir des autorités officielles suivantes :
- France-Diplomatie (diplomatie.gouv.fr / Conseils aux voyageurs)
- Institut Pasteur (Centre médical / Préparer son voyage)
- OMS / WHO (International Travel and Health)
- Santé publique France

Tu réponds STRICTEMENT en JSON conforme au schéma. Pas de Markdown, pas de prose hors JSON.
Si une info est incertaine, mets-la dans "notes" et baisse "confidence". N'invente jamais de zone, niveau ou vaccin.`;

const SYSTEM_EN = `You synthesize ONLY from these official authorities:
- France-Diplomatie (diplomatie.gouv.fr / travel advice)
- Institut Pasteur (Medical centre / Prepare your trip)
- WHO (International Travel and Health)
- Santé publique France

Reply STRICTLY as JSON matching the schema. No markdown, no prose outside JSON.
If uncertain, put it in "notes" and lower "confidence". Never invent zones, levels or vaccines.`;

const buildUserPrompt = (destination: string, isFr: boolean) => {
  if (isFr) {
    return `Destination : ${destination}.
Donne les informations à jour suivantes au format JSON STRICT :

{
  "safety": {
    "level": 1|2|3|4,                       // 1 vigilance normale, 2 renforcée, 3 déconseillé sauf raison impérative, 4 formellement déconseillé
    "level_label": "string court FR",
    "summary": "2 phrases max, neutres, factuelles",
    "zones_to_avoid": ["string", ...],      // max 5, vide si aucune
    "source": "France-Diplomatie",
    "source_url": "https://www.diplomatie.gouv.fr/..."
  },
  "vaccines": {
    "mandatory": ["string", ...],           // ex : "Fièvre jaune" si exigé à l'entrée
    "recommended": ["string", ...],         // ex : "Hépatite A", "Typhoïde"
    "routine_reminder": "string court",     // ex : "DTP et ROR à jour"
    "malaria_risk": "none"|"low"|"moderate"|"high",
    "notes": "string court (ou vide)",
    "source": "Institut Pasteur / OMS",
    "source_url": "https://www.pasteur.fr/..."
  },
  "confidence": 0.0-1.0,
  "destination": "${destination}"
}`;
  }
  return `Destination: ${destination}.
Return the up-to-date info as STRICT JSON:

{
  "safety": {
    "level": 1|2|3|4,
    "level_label": "short EN string",
    "summary": "max 2 sentences, neutral, factual",
    "zones_to_avoid": ["string", ...],
    "source": "France-Diplomatie",
    "source_url": "https://www.diplomatie.gouv.fr/..."
  },
  "vaccines": {
    "mandatory": ["string", ...],
    "recommended": ["string", ...],
    "routine_reminder": "short string",
    "malaria_risk": "none"|"low"|"moderate"|"high",
    "notes": "short string (or empty)",
    "source": "Institut Pasteur / WHO",
    "source_url": "https://www.pasteur.fr/..."
  },
  "confidence": 0.0-1.0,
  "destination": "${destination}"
}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "visa-official-info", subject: __auth.userId, limit: 20, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  const __quota = await enforceQuota("visa", req, corsHeaders);
  if (__quota) return __quota;


  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const destination = (body.destination || "").trim();
    const locale: "fr" | "en" = body.locale === "en" ? "en" : "fr";

    if (!destination || destination.length < 2 || destination.length > 100) {
      return new Response(
        JSON.stringify({ error: "invalid_destination" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isFr = locale === "fr";
    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: isFr ? SYSTEM_FR : SYSTEM_EN },
            { role: "user", content: buildUserPrompt(destination, isFr) },
          ],
          temperature: 0.2,
        }),
      },
    );

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "rate_limited" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "credits_exhausted" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      return new Response(
        JSON.stringify({ error: "ai_error", status: aiResp.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiResp.json();
    const content = aiJson?.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "empty_ai_response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: "invalid_json_from_ai" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ...parsed,
        lastChecked: new Date().toISOString(),
        locale,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("visa-official-info fatal:", e);
    return new Response(
      JSON.stringify({ error: "unexpected_error", message: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
