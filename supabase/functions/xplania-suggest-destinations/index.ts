// Xplania destinations suggestion — matches traveler profile DNA against destinations
// with an originality boost, excludes already-shown/rejected, and returns top matches
// with a hidden gem + curated doc chunk per destination.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";
import { enforceQuota } from "../_shared/quota-guard.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { recordShownRecommendations } from "../_shared/travel-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DIMS = [
  "culture", "adventure", "nature", "comfort", "budget", "food",
  "authenticity", "social", "wellbeing", "nomad", "luxury", "organization",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const __quota = await enforceQuota("discover", req, corsHeaders);
  if (__quota) return __quota;

  const rl = checkRateLimit({ key: "xplania-suggest-destinations", subject: auth.userId, limit: 20, windowMs: 60_000 });
  const rlResp = rateLimitResponse(rl, corsHeaders);
  if (rlResp) return rlResp;

  try {
    const body = await req.json().catch(() => ({}));
    const { limit = 5, originalityBoost = 0.4, locale = "fr" } = body || {};

    const authHeader = req.headers.get("Authorization")!;
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const supaAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load traveler profile
    const { data: profile } = await supa
      .from("traveler_profiles")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle();

    // Load rejected destinations to exclude
    const { data: history } = await supa
      .from("user_recommendations_history")
      .select("item_key, liked")
      .eq("user_id", auth.userId)
      .eq("item_type", "destination");
    const rejected = new Set((history ?? []).filter((h) => h.liked === false).map((h) => h.item_key));
    const seen = new Set((history ?? []).map((h) => h.item_key));

    // Load destinations (admin client — safe read, RLS would allow anyway)
    const { data: destinations, error } = await supaAdmin
      .from("destinations")
      .select("*")
      .eq("active", true);
    if (error) throw error;

    // Build profile scores vector
    const p: Record<string, number> = {};
    for (const d of DIMS) p[d] = Math.max(0, profile?.[`${d}_score`] ?? 0);
    const pNorm = Math.sqrt(DIMS.reduce((s, k) => s + p[k] * p[k], 0)) || 1;

    // Score each destination: cosine similarity on DNA + originality boost - seen penalty
    const scored = (destinations ?? [])
      .filter((d) => !rejected.has(d.slug))
      .map((d) => {
        const dnaVec: Record<string, number> = {};
        for (const k of DIMS) dnaVec[k] = d[`${k}_score`] ?? 0;
        const dNorm = Math.sqrt(DIMS.reduce((s, k) => s + dnaVec[k] * dnaVec[k], 0)) || 1;
        const dot = DIMS.reduce((s, k) => s + p[k] * dnaVec[k], 0);
        const cosine = dot / (pNorm * dNorm); // 0..1
        const originality = (d.originality_score ?? 50) / 100; // 0..1
        const seenPenalty = seen.has(d.slug) ? 0.15 : 0;
        const finalScore = cosine * (1 - originalityBoost) + originality * originalityBoost - seenPenalty;
        return { destination: d, score: finalScore, cosine, originality };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Enrich with hidden gems and doc snippet
    const enriched = await Promise.all(
      scored.map(async ({ destination, score, cosine, originality }) => {
        const [{ data: gems }, { data: docs }] = await Promise.all([
          supaAdmin
            .from("hidden_gems")
            .select("id, name, kind, summary_fr, summary_en, best_season, originality_score, tags")
            .eq("destination_id", destination.id)
            .eq("active", true)
            .order("originality_score", { ascending: false })
            .limit(3),
          supaAdmin
            .from("travel_documents")
            .select("title, content, category")
            .eq("destination_slug", destination.slug)
            .eq("locale", locale)
            .limit(2),
        ]);
        return {
          slug: destination.slug,
          name: destination.name,
          country: destination.country,
          region: destination.region,
          lat: destination.lat,
          lng: destination.lng,
          hero_image_url: destination.hero_image_url,
          summary: locale === "en" ? destination.summary_en : destination.summary_fr,
          tags: destination.tags,
          best_seasons: destination.best_seasons,
          originality_score: destination.originality_score,
          tourism_mass: destination.tourism_mass,
          match_score: Math.round(score * 100),
          match_reason: {
            profile_match: Math.round(cosine * 100),
            originality: Math.round(originality * 100),
          },
          hidden_gems: (gems ?? []).map((g) => ({
            name: g.name,
            kind: g.kind,
            summary: locale === "en" ? g.summary_en : g.summary_fr,
            best_season: g.best_season,
            originality_score: g.originality_score,
            tags: g.tags,
          })),
          curated_notes: (docs ?? []).map((d) => ({ title: d.title, content: d.content, category: d.category })),
        };
      }),
    );

    // Record shown destinations in history
    await recordShownRecommendations(
      supaAdmin,
      auth.userId,
      enriched.map((d) => ({
        item_key: d.slug,
        item_type: "destination",
        source: "xplania-suggest-destinations",
        context: { match_score: d.match_score },
      })),
    );

    return new Response(JSON.stringify({ destinations: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("xplania-suggest-destinations error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
