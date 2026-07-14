import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;
  const __rl = checkRateLimit({ key: "trip-seed-activities", subject: __auth.userId, limit: 10, windowMs: 60_000 });
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

    const activities: any[] = [];
    let pos = 0;

    // 1. From trip recommendations (AI)
    const recs = trip.recommendations as any;
    const itinerary = recs?.itinerary || recs?.dailyPlan || recs?.days || [];
    if (Array.isArray(itinerary)) {
      itinerary.forEach((day: any, dayIdx: number) => {
        const date = day.date || (trip.departure_date ? addDays(trip.departure_date, dayIdx) : null);
        const items = day.activities || day.items || [];
        if (Array.isArray(items)) {
          items.forEach((it: any) => {
            const title = typeof it === "string" ? it : (it.title || it.name || it.activity);
            if (!title) return;
            activities.push({
              trip_id: tripId,
              user_id: user.id,
              source: "ai",
              day_date: date,
              title: String(title).slice(0, 200),
              description: typeof it === "object" ? (it.description || null) : null,
              category: typeof it === "object" ? (it.category || null) : null,
              status: "todo",
              position: pos++,
            });
          });
        }
      });
    }

    // 2. From journal location blocks
    const { data: journal } = await supabase
      .from("journals").select("id").eq("trip_id", tripId).maybeSingle();
    if (journal) {
      const { data: blocks } = await supabase
        .from("journal_blocks")
        .select("content, day_id, journal_days!inner(date)")
        .eq("journal_id", journal.id)
        .eq("type", "location");
      blocks?.forEach((b: any) => {
        const c = b.content || {};
        if (!c.name && !c.title) return;
        activities.push({
          trip_id: tripId,
          user_id: user.id,
          source: "journal",
          day_date: b.journal_days?.date || null,
          title: String(c.name || c.title).slice(0, 200),
          description: c.description || null,
          lat: c.lat || null,
          lng: c.lng || null,
          status: "todo",
          position: pos++,
        });
      });
    }

    // Clear previous AI/journal-sourced activities then insert
    await supabase.from("trip_activities").delete().eq("trip_id", tripId).in("source", ["ai", "journal"]);

    if (activities.length > 0) {
      const { error: insErr } = await supabase.from("trip_activities").insert(activities);
      if (insErr) throw insErr;
    }

    return new Response(JSON.stringify({ count: activities.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
