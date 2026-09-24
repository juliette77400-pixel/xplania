import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateJson, aiErrorResponse } from "../_shared/ai-json.ts";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __rl = checkRateLimit({ key: "visa-info", subject: __auth.userId, limit: 20, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  const __quota = await enforceQuota("visa", req, corsHeaders);
  if (__quota) return __quota;


  try {
    const { destination, nationality, duration, travelerType, locale = "fr" } = await req.json();
    const isEN = locale === "en";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!destination) {
      return new Response(JSON.stringify({ error: "destination is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = isEN
      ? `You are an expert in travel formalities and international diplomacy. You provide accurate, up-to-date and practical information on visas, security, health and required travel documents.

 Reply with the JSON object only. ALL string fields must be in ENGLISH.

ACCURACY (it is 2026): only give information valid in 2026. For the embassy/consulate, check it is actually open: if the traveler's country representation is closed or suspended (e.g. the French embassy in Kabul, closed since 2021), say so clearly and give the nearest competent representation or the foreign ministry crisis centre. When unsure, point to the official website rather than inventing an address.
Tailor EVERYTHING (visa, checklist, steps, contacts) to the traveler's nationality.`
      : `Tu es un expert en formalités de voyage et diplomatie internationale. Tu fournis des informations précises, actualisées et pratiques sur les visas, la sécurité, la santé et les documents nécessaires pour voyager.

 Réponds uniquement avec l'objet JSON.

EXACTITUDE (nous sommes en 2026) : donne uniquement des informations valables en 2026. Pour l'ambassade ou le consulat, vérifie qu'il est réellement ouvert : si la représentation du pays du voyageur est fermée ou suspendue (ex. ambassade de France à Kaboul fermée depuis 2021), dis-le clairement et indique la représentation compétente la plus proche (ex. ambassade de France à Islamabad) ou le Centre de crise et de soutien du ministère. En cas de doute, renvoie vers le site officiel plutôt que d'inventer une adresse.
Adapte TOUT (visa, checklist, démarches, contacts) à la nationalité du voyageur.`;

    const userPrompt = isEN
      ? `Destination: ${destination}
Traveler nationality: ${nationality || "France"}
Stay duration: ${duration || "7"} days
Traveler type: ${travelerType || "tourist"}

Generate complete formalities information for this trip. All text in ENGLISH.`
      : `Destination : ${destination}
Nationalité du voyageur : ${nationality || "France"}
Durée du séjour : ${duration || "7"} jours
Type de voyageur : ${travelerType || "touriste"}

Génère les informations complètes de formalités pour ce voyage.`;

    const SCHEMA = {
                type: "object",
                properties: {
                  visa: {
                    type: "object",
                    properties: {
                      required: { type: "boolean", description: "Visa requis ou non" },
                      type: { type: "string", description: "Type de visa (ex: touristique, ESTA, exemption Schengen)" },
                      duration: { type: "string", description: "Durée max autorisée sans visa ou avec visa" },
                      details: { type: "string", description: "Détails et conditions du visa" },
                      cost: { type: "string", description: "Coût estimé du visa" },
                    },
                    required: ["required", "type", "duration", "details"],
                    additionalProperties: false,
                  },
                  security: {
                    type: "object",
                    properties: {
                      level: { type: "string", enum: ["safe", "moderate", "caution", "danger"], description: "Niveau de sécurité global" },
                      summary: { type: "string", description: "Résumé de la situation sécuritaire" },
                      zones_to_avoid: {
                        type: "array",
                        items: { type: "string" },
                        description: "Zones déconseillées",
                      },
                      tips: {
                        type: "array",
                        items: { type: "string" },
                        description: "Conseils de sécurité spécifiques",
                      },
                    },
                    required: ["level", "summary", "tips"],
                    additionalProperties: false,
                  },
                  health: {
                    type: "object",
                    properties: {
                      mandatory_vaccines: {
                        type: "array",
                        items: { type: "string" },
                        description: "Vaccins obligatoires",
                      },
                      recommended_vaccines: {
                        type: "array",
                        items: { type: "string" },
                        description: "Vaccins recommandés",
                      },
                      health_risks: {
                        type: "array",
                        items: { type: "string" },
                        description: "Risques sanitaires spécifiques",
                      },
                      insurance_required: { type: "boolean", description: "Assurance santé obligatoire ou non" },
                      tips: {
                        type: "array",
                        items: { type: "string" },
                        description: "Conseils santé spécifiques",
                      },
                    },
                    required: ["recommended_vaccines", "health_risks", "insurance_required", "tips"],
                    additionalProperties: false,
                  },
                  checklist: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item: { type: "string", description: "Élément de la checklist" },
                        category: { type: "string", enum: ["document", "santé", "pratique", "finance"], description: "Catégorie" },
                        priority: { type: "string", enum: ["obligatoire", "recommandé", "optionnel"], description: "Priorité" },
                      },
                      required: ["item", "category", "priority"],
                      additionalProperties: false,
                    },
                    description: "Checklist complète de préparation",
                  },
                  emergency_contacts: {
                    type: "object",
                    properties: {
                      embassy: { type: "string", description: "Ambassade/Consulat de la nationalité du voyageur" },
                      local_emergency: { type: "string", description: "Numéros d'urgence locaux" },
                      tourist_police: { type: "string", description: "Police touristique si applicable" },
                    },
                    required: ["embassy", "local_emergency"],
                    additionalProperties: false,
                  },
                },
                required: ["visa", "security", "health", "checklist", "emergency_contacts"],
                additionalProperties: false,
              };
    let visaInfo: unknown;
    try {
      visaInfo = await generateJson({ instructions: systemPrompt, input: userPrompt, schema: SCHEMA, name: "visa_info" });
    } catch (e) {
      const r = aiErrorResponse(e, corsHeaders);
      if (r) return r;
      throw e;
    }

    return new Response(JSON.stringify(visaInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("visa-info error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
