import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;
  const __rl = checkRateLimit({ key: "explore-summary", subject: __auth.userId, limit: 10, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

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

    const { data: trip } = await supabase.from("trips").select("destination, departure_date, return_date, duration").eq("id", tripId).maybeSingle();
    const { data: nodes } = await supabase.from("explore_nodes").select("name,type,status,level,visited_at").eq("trip_id", tripId);
    const { data: progress } = await supabase.from("explore_progress").select("*").eq("trip_id", tripId).maybeSingle();
    const { data: badges } = await supabase.from("explore_badges").select("name,description").eq("trip_id", tripId);
    const { data: media } = await supabase.from("explore_node_media").select("caption,mood").eq("trip_id", tripId);

    const visited = (nodes || []).filter((n: any) => n.status === "visited");
    const moods = (media || []).map((m: any) => m.mood).filter(Boolean);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const prompt = `Crée un récit poétique et personnel résumant ce voyage à ${trip?.destination}.
Durée: ${trip?.duration || "?"} jours.
${visited.length} lieux explorés: ${visited.map((n: any) => n.name).join(", ")}.
Badges: ${(badges || []).map((b: any) => b.name).join(", ") || "aucun"}.
Ambiances ressenties: ${moods.join(", ") || "variées"}.
Score: ${progress?.total_points || 0} pts.

Écris un récit en 3 paragraphes (intro émotionnelle, moments forts, conclusion). Style storytelling chaleureux, en français, à la 2e personne (tu).`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const ai = await aiResp.json();
    const story = ai?.choices?.[0]?.message?.content || "";

    const stats = {
      destination: trip?.destination,
      duration: trip?.duration,
      visited: visited.length,
      total: (nodes || []).length,
      points: progress?.total_points || 0,
      badges: (badges || []).length,
      cities: progress?.cities_completed || 0,
      media: (media || []).length,
      topTypes: Object.entries(visited.reduce((acc: any, n: any) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {}))
        .sort((a: any, b: any) => b[1] - a[1]).slice(0, 3),
    };

    return new Response(JSON.stringify({ story, stats }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("explore-summary error", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
