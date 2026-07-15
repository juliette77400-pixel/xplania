
import { requireAuth } from "../_shared/require-auth.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";// Compute insights from a journal: most-visited places, mood evolution, best moments
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;

  const __quota = await enforceQuota("carnet", req, corsHeaders);
  if (__quota) return __quota;

  try {
    const { days } = await req.json();
    if (!Array.isArray(days)) {
      return new Response(JSON.stringify({ error: "days required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const locationCounts: Record<string, number> = {};
    const moodTimeline: { date: string; score: number; emoji: string }[] = [];
    const highlights: { date: string; text: string }[] = [];
    let photoCount = 0;
    let noteCount = 0;

    for (const d of days) {
      for (const b of d.blocks || []) {
        const c = b.content || {};
        if (b.type === "location" && c.name) locationCounts[c.name] = (locationCounts[c.name] || 0) + 1;
        if (b.type === "mood" && typeof c.score === "number") moodTimeline.push({ date: d.date, score: c.score, emoji: c.emoji || "😊" });
        if (b.type === "highlight" && c.text) highlights.push({ date: d.date, text: c.text });
        if (b.type === "photo") photoCount++;
        if (b.type === "note") noteCount++;
      }
    }

    const topLocations = Object.entries(locationCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, count]) => ({ name, count }));

    const happiestDay = moodTimeline.length
      ? moodTimeline.reduce((a, b) => (a.score >= b.score ? a : b))
      : null;

    const totalBlocks = days.reduce((acc: number, d: any) => acc + (d.blocks?.length || 0), 0);

    return new Response(JSON.stringify({
      topLocations,
      moodTimeline,
      highlights,
      happiestDay,
      stats: { photoCount, noteCount, totalBlocks, daysCount: days.length },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
