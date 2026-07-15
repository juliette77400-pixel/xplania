import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;
  const __rl = checkRateLimit({ key: "explore-suggest", subject: __auth.userId, limit: 20, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  const __quota = await enforceQuota("explore", req, corsHeaders);
  if (__quota) return __quota;

  try {
    const { tripId } = await req.json();
    if (!tripId) throw new Error("tripId required");

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: trip } = await supabase.from("trips").select("destination, form_data").eq("id", tripId).maybeSingle();
    const { data: nodes } = await supabase.from("explore_nodes").select("name,type,status,level").eq("trip_id", tripId);

    const visited = (nodes || []).filter((n: any) => n.status === "visited").map((n: any) => `${n.name} (${n.type})`);
    const planned = (nodes || []).filter((n: any) => n.status !== "visited").map((n: any) => `${n.name} (${n.type})`);
    const types = (nodes || []).reduce((acc: any, n: any) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {});

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const prompt = `Tu es un guide voyage local pour ${trip?.destination || "cette destination"}.
Lieux déjà visités: ${visited.join(", ") || "aucun"}.
Lieux planifiés: ${planned.join(", ") || "aucun"}.
Répartition: ${JSON.stringify(types)}.

Suggère 4 prochains lieux PRÉCIS et LOCAUX à explorer (noms réels), en équilibrant les types manquants. Évite les doublons.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu réponds uniquement via l'outil suggest_places." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_places",
            description: "Suggère 4 lieux précis",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", enum: ["food", "culture", "nature", "nightlife", "activity", "place"] },
                      description: { type: "string" },
                      reason: { type: "string", description: "Pourquoi ce lieu maintenant" },
                    },
                    required: ["name", "type", "description", "reason"],
                  },
                },
              },
              required: ["suggestions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_places" } },
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const ai = await aiResp.json();
    const args = ai?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { suggestions: [] };

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("explore-suggest error", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
