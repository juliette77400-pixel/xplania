import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POINTS_BY_LEVEL: Record<number, number> = { 1: 100, 2: 50, 3: 30 };

const detectType = (text: string): string => {
  const t = text.toLowerCase();
  if (/restaurant|café|bistro|cuisine|déjeun|dîner|food|gastronom/.test(t)) return "food";
  if (/musée|museum|galerie|monument|temple|église|cathédrale|patrimoine|histo|culture/.test(t)) return "culture";
  if (/parc|nature|montagne|plage|lac|rivière|forêt|trek|randonn|jardin/.test(t)) return "nature";
  if (/bar|club|nuit|night|concert|spectacle/.test(t)) return "nightlife";
  if (/hôtel|hotel|auberge|hébergement|airbnb/.test(t)) return "hotel";
  if (/balade|visite|excursion|tour|activité|aventure/.test(t)) return "activity";
  return "place";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;
  const __rl = checkRateLimit({ key: "explore-seed", subject: __auth.userId, limit: 10, windowMs: 60_000 });
  const __rlResp = rateLimitResponse(__rl, corsHeaders);
  if (__rlResp) return __rlResp;

  try {
    const { tripId } = await req.json();
    if (!tripId) {
      return new Response(JSON.stringify({ error: "tripId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId).maybeSingle();
    if (!trip) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Wipe previous auto-generated data
    await supabase.from("explore_edges").delete().eq("trip_id", tripId);
    await supabase.from("explore_nodes").delete().eq("trip_id", tripId).in("source", ["ai", "journal", "tracking"]);

    // 1. CITY node (level 1)
    const cityName = trip.arrival_city || trip.destination || "Destination";
    const { data: cityNode, error: cityErr } = await supabase.from("explore_nodes").insert({
      trip_id: tripId,
      user_id: user.id,
      level: 1,
      name: cityName,
      type: "city",
      status: "planned",
      points: POINTS_BY_LEVEL[1],
      source: "ai",
      position_x: 0,
      position_y: 0,
    }).select().single();
    if (cityErr) throw cityErr;

    const placeNodes: any[] = [];
    const recs = (trip.recommendations || {}) as any;

    // 2. From AI activities
    const aiActivities = recs.activities || [];
    if (Array.isArray(aiActivities)) {
      aiActivities.slice(0, 12).forEach((a: any, i: number) => {
        const name = typeof a === "string" ? a : (a.name || a.title);
        if (!name) return;
        const desc = typeof a === "object" ? (a.description || null) : null;
        const type = (typeof a === "object" && a.type) ? a.type : detectType(name + " " + (desc || ""));
        placeNodes.push({
          trip_id: tripId,
          user_id: user.id,
          parent_id: cityNode.id,
          level: 2,
          name: String(name).slice(0, 200),
          description: desc,
          type,
          status: "planned",
          points: POINTS_BY_LEVEL[2],
          source: "ai",
          position_x: Math.cos((i / 12) * 2 * Math.PI) * 300,
          position_y: Math.sin((i / 12) * 2 * Math.PI) * 300,
        });
      });
    }

    // From AI local recommendations
    const localRecs = recs.localRecommendations || [];
    if (Array.isArray(localRecs)) {
      localRecs.slice(0, 8).forEach((r: any, i: number) => {
        const name = typeof r === "string" ? r : (r.name || r.title);
        if (!name) return;
        const desc = typeof r === "object" ? (r.description || null) : null;
        const cat = typeof r === "object" ? (r.category || "") : "";
        const type = detectType(name + " " + cat + " " + (desc || ""));
        placeNodes.push({
          trip_id: tripId,
          user_id: user.id,
          parent_id: cityNode.id,
          level: 2,
          name: String(name).slice(0, 200),
          description: desc,
          type,
          status: "planned",
          points: POINTS_BY_LEVEL[2],
          source: "ai",
          position_x: Math.cos((i / 8) * 2 * Math.PI + 0.4) * 450,
          position_y: Math.sin((i / 8) * 2 * Math.PI + 0.4) * 450,
        });
      });
    }

    // 3. From journal location blocks
    const { data: journal } = await supabase.from("journals").select("id").eq("trip_id", tripId).maybeSingle();
    if (journal) {
      const { data: blocks } = await supabase
        .from("journal_blocks")
        .select("content")
        .eq("journal_id", journal.id)
        .eq("type", "location");
      blocks?.forEach((b: any, i: number) => {
        const c = b.content || {};
        const name = c.name || c.title;
        if (!name) return;
        placeNodes.push({
          trip_id: tripId,
          user_id: user.id,
          parent_id: cityNode.id,
          level: 2,
          name: String(name).slice(0, 200),
          description: c.description || null,
          type: detectType(name + " " + (c.description || "")),
          lat: c.lat || null,
          lng: c.lng || null,
          status: "visited",
          points: POINTS_BY_LEVEL[2],
          source: "journal",
          position_x: Math.cos((i / 6) * 2 * Math.PI + 0.8) * 600,
          position_y: Math.sin((i / 6) * 2 * Math.PI + 0.8) * 600,
        });
      });
    }

    // 4. From tracking activities
    const { data: trackedActs } = await supabase
      .from("trip_activities")
      .select("title, description, category, lat, lng, status")
      .eq("trip_id", tripId);
    trackedActs?.forEach((a: any, i: number) => {
      placeNodes.push({
        trip_id: tripId,
        user_id: user.id,
        parent_id: cityNode.id,
        level: 2,
        name: String(a.title).slice(0, 200),
        description: a.description,
        type: detectType((a.title || "") + " " + (a.category || "")),
        lat: a.lat,
        lng: a.lng,
        status: a.status === "done" ? "visited" : "planned",
        points: POINTS_BY_LEVEL[2],
        source: "tracking",
        position_x: Math.cos((i / 6) * 2 * Math.PI + 1.2) * 750,
        position_y: Math.sin((i / 6) * 2 * Math.PI + 1.2) * 750,
      });
    });

    // Insert all places
    let insertedPlaces: any[] = [];
    if (placeNodes.length > 0) {
      const { data: inserted, error: pErr } = await supabase.from("explore_nodes").insert(placeNodes).select();
      if (pErr) throw pErr;
      insertedPlaces = inserted || [];
    }

    // 5. Edges (city -> place)
    const edges = insertedPlaces.map((p) => ({
      trip_id: tripId,
      user_id: user.id,
      from_node_id: cityNode.id,
      to_node_id: p.id,
      edge_type: "logical",
    }));

    // Geographic edges between places that have lat/lng (<2km)
    const geoPlaces = insertedPlaces.filter((p) => p.lat && p.lng);
    for (let i = 0; i < geoPlaces.length; i++) {
      for (let j = i + 1; j < geoPlaces.length; j++) {
        const a = geoPlaces[i], b = geoPlaces[j];
        const dx = (a.lat - b.lat) * 111;
        const dy = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
        const km = Math.sqrt(dx * dx + dy * dy);
        if (km < 2) {
          edges.push({
            trip_id: tripId,
            user_id: user.id,
            from_node_id: a.id,
            to_node_id: b.id,
            edge_type: "geographic",
          });
        }
      }
    }

    if (edges.length > 0) {
      await supabase.from("explore_edges").insert(edges);
    }

    return new Response(JSON.stringify({
      city: cityNode.name,
      nodes: 1 + insertedPlaces.length,
      edges: edges.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("explore-seed error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
