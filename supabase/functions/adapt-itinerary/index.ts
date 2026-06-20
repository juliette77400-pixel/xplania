import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tripId, destination, locale = "fr" } = await req.json();
    if (!tripId || !destination) {
      return new Response(JSON.stringify({ error: "tripId and destination required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: alerts } = await supabase
      .from("trip_alerts")
      .select("category, severity, title, message")
      .eq("trip_id", tripId)
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: activities } = await supabase
      .from("trip_activities")
      .select("title, day_date, status")
      .eq("trip_id", tripId)
      .order("day_date");

    const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE) throw new Error("LOVABLE_API_KEY not configured");

    const isEN = locale === "en";
    const prompt = isEN
      ? `Active alerts for ${destination}:\n${(alerts || [])
          .map((a) => `- [${a.severity}/${a.category}] ${a.title}: ${a.message}`)
          .join("\n")}\n\nPlanned activities:\n${(activities || [])
          .map((a) => `- ${a.day_date}: ${a.title} (${a.status})`)
          .join("\n")}\n\nSuggest 2 or 3 concrete itinerary adaptations (postpone, swap, indoor alternative, safer area). Return via "adaptations" tool.`
      : `Alertes actives pour ${destination} :\n${(alerts || [])
          .map((a) => `- [${a.severity}/${a.category}] ${a.title} : ${a.message}`)
          .join("\n")}\n\nActivités prévues :\n${(activities || [])
          .map((a) => `- ${a.day_date} : ${a.title} (${a.status})`)
          .join("\n")}\n\nPropose 2 ou 3 adaptations d'itinéraire concrètes (reporter, remplacer, alternative en intérieur, zone plus sûre). Réponds via le tool "adaptations".`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: isEN ? "You adapt travel itineraries based on alerts." : "Tu adaptes des itinéraires de voyage en fonction d'alertes." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "adaptations",
              description: "Return itinerary adaptation suggestions",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        reason: { type: "string" },
                        action: { type: "string", description: "Concrete change to make" },
                      },
                      required: ["title", "reason", "action"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "adaptations" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      throw new Error(`AI gateway ${aiRes.status}: ${txt}`);
    }
    const aiJson = await aiRes.json();
    const call = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : { items: [] };

    return new Response(JSON.stringify({ ok: true, adaptations: args.items || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("adapt-itinerary error", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
