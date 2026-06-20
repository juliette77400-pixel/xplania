import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;


  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { formData, locale = "fr" } = await req.json();
    const isEN = locale === "en";
    const dest = formData.destination || (isEN ? "unknown destination" : "destination inconnue");
    const departureDate = formData.departureDate || (isEN ? "not specified" : "non précisée");
    const returnDate = formData.returnDate || (isEN ? "not specified" : "non précisée");
    const budget = formData.totalBudget || 1500;
    const days = formData.duration ? parseInt(formData.duration) || 7 : 7;
    const travelerType = formData.travelerType || "solo";
    const objectives = (formData.objectives || []).join(", ") || (isEN ? "discovery" : "découverte");
    const climatePreference = formData.climatePreference || (isEN ? "not specified" : "non précisé");
    const culturalImmersion = formData.culturalImmersion || (isEN ? "not specified" : "non précisé");
    const constraints = (formData.constraints || []).join(", ") || (isEN ? "none" : "aucune");
    const dietaryPreferences = (formData.dietaryPreferences || []).join(", ") || (isEN ? "none" : "aucune");
    const activityLevel = formData.activityLevel || (isEN ? "moderate" : "modéré");
    const environmentalSensitivity = formData.environmentalSensitivity || (isEN ? "average" : "moyenne");

    const systemPrompt = isEN
      ? `You are an expert travel planner. Provide recommendations STRICTLY based on the precise destination given. NO generic advice. Every piece of information must be specific to the country, region or city mentioned.

Reply ONLY in valid JSON with this exact structure (all values in ENGLISH):
{
  "weather": { "current": "typical weather for the period", "temperature": "average temperature in °C", "forecast": "forecast over the trip period", "advice": "specific clothing advice" },
  "culturalTips": [ {"title": "short title", "description": "detailed cultural tip specific to the place"} ],
  "activities": [ {"name": "activity name", "description": "description", "type": "culture|nature|gastronomy|adventure", "estimatedCost": "estimated cost in €"} ],
  "localRecommendations": [ {"category": "restaurant|transport|neighborhood|market", "name": "specific name", "description": "why it's recommended"} ],
  "documents": ["country-specific required document"],
  "luggage": ["recommended luggage item"],
  "budgetBreakdown": [ {"category": "name", "amount": number, "tip": "saving tip"} ]
}

IMPORTANT: Provide exactly 5 cultural tips, 6 activities, 5 local recommendations, 5 documents, 6 luggage items, and 5 budget categories.`
      : `Tu es un expert en planification de voyages. Tu dois fournir des recommandations STRICTEMENT basées sur la destination précise fournie. AUCUN conseil générique n'est accepté. Chaque information doit être spécifique au pays, à la région ou à la ville mentionnée.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "weather": { "current": "description météo actuelle typique pour la période", "temperature": "température moyenne en °C", "forecast": "prévisions sur la période du voyage", "advice": "conseil vestimentaire spécifique" },
  "culturalTips": [ {"title": "titre court", "description": "conseil culturel détaillé et spécifique au lieu"} ],
  "activities": [ {"name": "nom de l'activité", "description": "description", "type": "culture|nature|gastronomie|aventure", "estimatedCost": "coût estimé en €"} ],
  "localRecommendations": [ {"category": "restaurant|transport|quartier|marché", "name": "nom spécifique", "description": "pourquoi c'est recommandé"} ],
  "documents": ["document requis spécifique au pays"],
  "luggage": ["élément de bagage recommandé"],
  "budgetBreakdown": [ {"category": "nom", "amount": number, "tip": "conseil pour économiser"} ]
}

IMPORTANT: Fournis exactement 5 conseils culturels, 6 activités, 5 recommandations locales, 5 documents, 6 éléments de bagage, et 5 catégories de budget.`;

    const userPrompt = isEN
      ? `Destination: ${dest}
Dates: from ${departureDate} to ${returnDate} (${days} days)
Traveler type: ${travelerType}
Goals: ${objectives}
Activity level: ${activityLevel}
Total budget: ${budget}€
Climate preference: ${climatePreference}
Cultural immersion: ${culturalImmersion}
Constraints: ${constraints}
Dietary preferences: ${dietaryPreferences}
Environmental sensitivity: ${environmentalSensitivity}

Generate ULTRA-SPECIFIC recommendations for ${dest}. Cite real place names, local dishes, precise customs. No generalities. Reply in ENGLISH.`
      : `Destination : ${dest}
Dates : du ${departureDate} au ${returnDate} (${days} jours)
Type de voyageur : ${travelerType}
Objectifs : ${objectives}
Niveau d'activité : ${activityLevel}
Budget total : ${budget}€
Préférence climatique : ${climatePreference}
Immersion culturelle : ${culturalImmersion}
Contraintes : ${constraints}
Régime alimentaire : ${dietaryPreferences}
Sensibilité environnementale : ${environmentalSensitivity}

Génère des recommandations ULTRA-SPÉCIFIQUES pour ${dest}. Cite des noms de lieux réels, des plats locaux, des coutumes précises. Aucune généralité.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants. Ajoutez des crédits dans Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let recommendations;
    try {
      recommendations = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Erreur de parsing des recommandations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("travel-recommendations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
