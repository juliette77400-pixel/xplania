// Cultural immersion guide: generates ONE pillar for ONE country, cached forever.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { generateJson, aiErrorResponse } from "../_shared/ai-json.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";
import { brandHeader, NEUTRALITY_RULE_FR, NEUTRALITY_RULE_EN } from "../_shared/prompts.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PILLARS: Record<string, { fr: string; en: string }> = {
  dress: { fr: "Tenue & vêtements", en: "Dress & clothing" },
  food: { fr: "Gastronomie & table", en: "Food & table manners" },
  gestures: { fr: "Gestes & langage corporel", en: "Gestures & body language" },
  greetings: { fr: "Salutations & politesse", en: "Greetings & politeness" },
  social: { fr: "Codes sociaux (ponctualité, pourboires, cadeaux, marchandage, files d'attente)", en: "Social codes (punctuality, tipping, gifts, bargaining, queues)" },
  language: { fr: "Langue & expressions locales", en: "Language & local expressions" },
  values: { fr: "Valeurs, traditions & religion", en: "Values, traditions & religion" },
  calendar: { fr: "Fêtes & calendrier", en: "Holidays & calendar" },
  sociallife: { fr: "Vie sociale (amis, colocation, sorties)", en: "Social life (friends, flatshare, going out)" },
  work: { fr: "Études & monde pro", en: "Studies & workplace" },
  popculture: { fr: "Culture populaire", en: "Pop culture" },
  shock: { fr: "Choc culturel", en: "Culture shock" },
};

const SCHEMA = {
  type: "object",
  properties: {
    ping: { type: "string" },
    dos: { type: "array", items: { type: "object", properties: { text: { type: "string" }, why: { type: "string" } }, required: ["text", "why"], additionalProperties: false } },
    donts: { type: "array", items: { type: "object", properties: { text: { type: "string" }, why: { type: "string" }, severity: { type: "string", enum: ["low", "medium", "high"] } }, required: ["text", "why", "severity"], additionalProperties: false } },
    homeVsHere: { type: "array", items: { type: "string" } },
  },
  required: ["ping", "dos", "donts", "homeVsHere"],
  additionalProperties: false,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const auth = await requireAuth(req, cors);
  if (auth instanceof Response) return auth;

  try {
    const { countryCode, countryName, pillar, locale = "fr" } = await req.json();
    const lang = locale === "en" ? "en" : "fr";
    const code = String(countryCode || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(code) || !PILLARS[pillar] || !countryName) return json({ error: "invalid_request" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cached } = await admin.from("culture_guide_cache").select("content, created_at")
      .eq("country_code", code).eq("pillar", pillar).eq("locale", lang).maybeSingle();
    if (cached) return json({ content: cached.content, updatedAt: cached.created_at, cached: true });

    const rl = rateLimitResponse(checkRateLimit({ key: "culture-guide", subject: auth.userId, limit: 10, windowMs: 60_000 }), cors);
    if (rl) return rl;
    const quota = await enforceQuota("valise", req, cors);
    if (quota) return quota;

    const p = PILLARS[pillar][lang];
    const instructions = lang === "en"
      ? `${brandHeader("en")}\n\n${NEUTRALITY_RULE_EN}\n\nYou write a cultural immersion guide for students, interns, business travellers and explorers. Topic: cultural codes ONLY (no transport, health, safety, visa). Kind, human tone, never condescending, no stereotypes: speak of general tendencies and remind that every person is different. Give 3-4 "dos" and 3-4 "donts" (short, each with one-sentence "why"; severity low=harmless, medium=awkward, high=offensive), 2 "home (France) vs here" comparisons, and a short friendly tip from Ping. Reply with the JSON only.`
      : `${brandHeader("fr")}\n\n${NEUTRALITY_RULE_FR}\n\nTu rédiges un guide d'immersion culturelle pour étudiants, stagiaires, voyageurs pro et curieux. Sujet : UNIQUEMENT les codes culturels (pas de transport, santé, sécurité, visa). Ton humain, bienveillant, jamais condescendant, sans stéréotypes : parle de tendances générales et rappelle que chaque personne est différente. Donne 3-4 "dos" (à faire) et 3-4 "donts" (à éviter), courts, chacun avec un "why" d'une phrase (severity low=anodin, medium=maladroit, high=offensant), 2 comparaisons "Chez toi (France) / Ici" et une courte astuce bienveillante de Ping. Réponds uniquement avec le JSON.`;
    const input = lang === "en" ? `Country: ${countryName}\nPillar: ${p}` : `Pays : ${countryName}\nPilier : ${p}`;

    const content = await generateJson({ instructions, input, schema: SCHEMA, name: "culture_pillar", strict: true, effort: "low" });
    const { error } = await admin.from("culture_guide_cache").upsert(
      { country_code: code, pillar, locale: lang, content }, { onConflict: "country_code,pillar,locale" });
    if (error) console.error("[culture-guide] cache write failed", error);
    return json({ content, updatedAt: new Date().toISOString(), cached: false });
  } catch (e) {
    const r = aiErrorResponse(e, cors);
    if (r) return r;
    console.error("[culture-guide]", e);
    return json({ error: "unavailable" }, 500);
  }
});
