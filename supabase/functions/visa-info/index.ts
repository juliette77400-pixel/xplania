import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, nationality, duration, travelerType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!destination) {
      return new Response(JSON.stringify({ error: "destination is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Tu es un expert en formalités de voyage et diplomatie internationale. Tu fournis des informations précises, actualisées et pratiques sur les visas, la sécurité, la santé et les documents nécessaires pour voyager.

Réponds UNIQUEMENT en utilisant le tool "visa_info" fourni. Ne génère aucun texte en dehors de l'appel au tool.`;

    const userPrompt = `Destination : ${destination}
Nationalité du voyageur : ${nationality || "France"}
Durée du séjour : ${duration || "7"} jours
Type de voyageur : ${travelerType || "touriste"}

Génère les informations complètes de formalités pour ce voyage.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "visa_info",
              description: "Retourne les informations de visa, sécurité, santé et checklist pour un voyage.",
              parameters: {
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
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "visa_info" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output from AI");
    }

    const visaInfo = JSON.parse(toolCall.function.arguments);

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
