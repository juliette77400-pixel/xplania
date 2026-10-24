// Personalised formalities for one student profile: visa, passport, transit and
// a checklist. Security, health and emergency numbers come from the
// official-sources function (real official pages), not from this AI answer.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { countryContext } from "../_shared/country-facts.ts";
import { generateJsonSplit, aiErrorResponse } from "../_shared/ai-json.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { enforceQuota, withQuotaRefund } from "../_shared/quota-guard.ts";
import { SAFETY_RULE_EN, SAFETY_RULE_FR } from "../_shared/prompts.ts";
import { hasFreeMovement, EU_SOURCE_URL, EU_SOURCE_URL_EN } from "../_shared/visa-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const clip = (v: unknown, n = 80) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const code = (v: unknown) => (typeof v === "string" && /^[A-Za-z]{2}$/.test(v) ? v.toUpperCase() : "");

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    visa: {
      type: "object", additionalProperties: false,
      required: ["status", "title", "summary", "max_stay", "cost", "processing_time", "steps", "why", "official_url"],
      properties: {
        status: { type: "string", enum: ["required", "not_required", "depends", "to_verify"] },
        title: { type: "string", description: "Max 6 words, e.g. 'Student visa required'" },
        summary: { type: "string", description: "Max 2 short sentences" },
        max_stay: { type: "string" }, cost: { type: "string" }, processing_time: { type: "string" },
        steps: { type: "array", items: { type: "string" }, description: "Max 5 short steps or conditions" },
        why: { type: "string", description: "One sentence naming the profile facts used (nationality, purpose, length)" },
        official_url: { type: "string", description: "Official government or embassy URL only if certain, else empty" },
      },
    },
    passport: {
      type: "object", additionalProperties: false, required: ["summary", "rules", "id_card_accepted"],
      properties: {
        summary: { type: "string", description: "Max 2 short sentences" },
        rules: { type: "array", items: { type: "string" }, description: "Max 4" },
        id_card_accepted: { type: "string", enum: ["yes", "no", "unknown"] },
      },
    },
    transit: {
      type: "object", additionalProperties: false, required: ["needed", "summary"],
      properties: { needed: { type: "string", enum: ["yes", "no", "to_verify", "none"] }, summary: { type: "string" } },
    },
    checklist: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "item", "detail", "category", "priority", "condition"],
        properties: {
          id: { type: "string", description: "Short stable slug in English, e.g. 'passport-validity'" },
          item: { type: "string", description: "Max 10 words" },
          detail: { type: "string", description: "One short sentence" },
          category: { type: "string", enum: ["documents", "health", "money", "practical"] },
          priority: { type: "string", enum: ["required", "recommended", "if_applicable"] },
          condition: { type: "string", description: "When it applies (empty if always)" },
        },
      },
      description: "8 to 12 items personalised to this profile",
    },
    emergency_contacts: {
      type: "object", additionalProperties: false, required: ["embassy", "local_emergency"],
      properties: { embassy: { type: "string" }, local_emergency: { type: "string" } },
    },
  },
  required: ["visa", "passport", "transit", "checklist", "emergency_contacts"],
};

async function officialEntry(destinationCode: string): Promise<string> {
  if (!destinationCode) return "";
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await admin.from("official_info_cache").select("content, fetched_at").eq("country_code", destinationCode).eq("locale", "fr").maybeSingle();
    const e = (data?.content as { entry?: { short_stay?: string; long_stay?: string; documents?: string[]; other?: string[] } } | null)?.entry;
    if (!e) return "";
    return [e.short_stay, e.long_stay, ...(e.documents || []), ...(e.other || [])].filter(Boolean).join("\n").slice(0, 3000);
  } catch {
    return "";
  }
}

serve(withQuotaRefund(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const rl = rateLimitResponse(checkRateLimit({ key: "visa-info", subject: auth.userId, limit: 20, windowMs: 60_000 }), corsHeaders);
  if (rl) return rl;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "invalid_request" }, 400); }
  const destination = clip(b.destination);
  const nationality = clip(b.nationality);
  if (!destination || !nationality) return json({ error: "destination and nationality are required" }, 400);

  const quota = await enforceQuota("visa", req, corsHeaders);
  if (quota) return quota;

  try {
    const isEN = b.locale === "en";
    const destCode = code(b.destinationCode);
    const natCode = code(b.nationalityCode);
    const secondCode = code(b.secondNationalityCode);
    const residence = clip(b.residence);
    const secondNat = clip(b.secondNationality);
    const purpose = clip(b.stayPurpose);
    const days = Number.isFinite(Number(b.durationDays)) ? Math.max(0, Math.min(3650, Math.round(Number(b.durationDays)))) : 0;
    const departure = clip(b.departureDate, 10);
    const passportType = clip(b.passportType, 30) || "ordinary";
    const transit = Array.isArray(b.transitCountries) ? b.transitCountries.map((x) => clip(x, 60)).filter(Boolean).slice(0, 5) : [];
    const regions = clip(b.regions, 200);
    const freeMovement = destCode ? hasFreeMovement(destCode, [natCode, secondCode]) : false;
    const isFrench = natCode === "FR" || secondCode === "FR";
    const official = isFrench ? await officialEntry(destCode) : "";

    const system = isEN
      ? `You are an expert in student mobility formalities (studies, internships, exchanges). It is 2026. Reply with the JSON only; ALL strings in ENGLISH, short and plain.
Tailor everything to THIS profile (nationality, second nationality, residence, purpose, length, passport type, transit). Never give generic advice.
Honesty: if you are not sure for this nationality/purpose/length, use status "to_verify" or "depends" and say what to check. Never invent costs, delays or URLs; leave them empty when unsure.
Checklist: "required" only for a legal obligation that clearly applies to this profile; otherwise "recommended" or "if_applicable" with its condition. No visa item when no visa is needed.
${official ? `OFFICIAL EXTRACT (France Diplomatie, for French nationals) — treat as authoritative and do not contradict it:\n${official}\n` : ""}
${SAFETY_RULE_EN}`
      : `Tu es expert des formalités de mobilité étudiante (études, stages, échanges). Nous sommes en 2026. Réponds uniquement avec le JSON ; tous les textes en FRANÇAIS simple, courts, en tutoyant.
Adapte tout à CE profil (nationalité, seconde nationalité, résidence, motif, durée, type de passeport, transit). Jamais de conseil générique.
Honnêteté : si tu n'es pas sûr pour cette nationalité, ce motif ou cette durée, utilise le statut "to_verify" ou "depends" et dis quoi vérifier. N'invente jamais de coût, délai ou lien ; laisse vide en cas de doute.
Checklist : "required" uniquement pour une obligation légale qui s'applique clairement à ce profil ; sinon "recommended" ou "if_applicable" avec sa condition. Aucun élément visa si aucun visa n'est nécessaire.
${official ? `EXTRAIT OFFICIEL (France Diplomatie, pour les ressortissants français) — fais-lui confiance et ne le contredis pas :\n${official}\n` : ""}
${SAFETY_RULE_FR}`;

    const lines = isEN
      ? [`Destination: ${destination}`, `Nationality: ${nationality}`, secondNat && `Second nationality: ${secondNat}`, residence && `Country of residence: ${residence}`,
        purpose && `Purpose: ${purpose}`, days ? `Length: ${days} days` : "Length: unknown", departure && `Departure date: ${departure}`,
        `Passport type: ${passportType}`, transit.length ? `Transit countries: ${transit.join(", ")}` : "Transit: none (set transit.needed to \"none\")", regions && `Regions/cities visited: ${regions}`]
      : [`Destination : ${destination}`, `Nationalité : ${nationality}`, secondNat && `Seconde nationalité : ${secondNat}`, residence && `Pays de résidence : ${residence}`,
        purpose && `Motif : ${purpose}`, days ? `Durée : ${days} jours` : "Durée : inconnue", departure && `Date de départ : ${departure}`,
        `Type de passeport : ${passportType}`, transit.length ? `Pays de transit : ${transit.join(", ")}` : "Transit : aucun (mets transit.needed à \"none\")", regions && `Régions/villes : ${regions}`];

    let result: any;
    try {
      result = await generateJsonSplit({
        instructions: system + countryContext(destination, isEN ? "en" : "fr"),
        input: lines.filter(Boolean).join("\n"),
        schema: SCHEMA, name: "visa_info", effort: "low",
        parts: [["visa", "passport", "transit"], ["checklist", "emergency_contacts"]],
      });
    } catch (e) {
      const r = aiErrorResponse(e, corsHeaders);
      if (r) return r;
      throw e;
    }

    // Fixed rule: EU/EEA/Swiss citizens moving inside that area never need a visa.
    if (freeMovement) {
      result.visa = {
        status: "not_required",
        title: isEN ? "No visa needed" : "Pas de visa nécessaire",
        summary: isEN
          ? "Your nationality gives you free movement here: a valid ID card or passport is enough. For more than 3 months, local registration may be required."
          : "Ta nationalité te donne la libre circulation ici : une carte d'identité ou un passeport valide suffit. Au-delà de 3 mois, un enregistrement local peut être demandé.",
        max_stay: isEN ? "No limit (registration after 3 months may apply)" : "Sans limite (enregistrement possible après 3 mois)",
        cost: "", processing_time: "",
        steps: [],
        why: isEN ? "Rule applied: EU/EEA/Swiss free movement." : "Règle appliquée : libre circulation UE/EEE/Suisse.",
        official_url: isEN ? EU_SOURCE_URL_EN : EU_SOURCE_URL,
      };
      if (result.passport) result.passport.id_card_accepted = "yes";
      if (Array.isArray(result.checklist)) result.checklist = result.checklist.filter((c: any) => !/\bvisa\b/i.test(`${c?.item} ${c?.id}`));
    }

    // Aliases read by the previous version of the page (until it is republished).
    if (result.visa) {
      result.visa.required = result.visa.status === "required";
      result.visa.type = result.visa.title;
      result.visa.duration = result.visa.max_stay;
      result.visa.details = result.visa.summary;
    }
    return json({ ...result, rule: freeMovement ? "free_movement" : null, officialGrounded: !!official, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("visa-info error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
}));
