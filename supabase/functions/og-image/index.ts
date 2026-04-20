import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function svgImage({ title, subtitle, kind }: { title: string; subtitle: string; kind: string }) {
  const accent = kind === "suivi" ? "#a855f7" : "#22d3ee";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1224"/>
      <stop offset="100%" stop-color="#1a1033"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.6">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g font-family="'Plus Jakarta Sans', system-ui, sans-serif" fill="#ffffff">
    <text x="80" y="120" font-size="28" font-weight="600" fill="${accent}" letter-spacing="6">XPLANIA · ${kind.toUpperCase()}</text>
    <text x="80" y="280" font-size="78" font-weight="800">${escape(title.slice(0, 38))}</text>
    <text x="80" y="360" font-size="36" font-weight="500" fill="#cbd5e1">${escape(subtitle.slice(0, 60))}</text>
    <g transform="translate(80, 520)">
      <circle cx="20" cy="20" r="20" fill="${accent}"/>
      <text x="56" y="28" font-size="24" font-weight="600">Voyage immersif propulsé par l'IA</text>
    </g>
  </g>
</svg>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") || "carnet"; // carnet | suivi
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response("missing slug", { status: 400, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let title = "Voyage Xplania";
    let subtitle = "Découvre cette aventure";

    if (kind === "carnet") {
      const { data } = await supabase
        .from("journals")
        .select("title, trip_id, trips(destination, arrival_city)")
        .eq("public_slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      if (data) {
        title = (data as any).title || title;
        const trip = (data as any).trips;
        subtitle = trip?.destination || trip?.arrival_city || subtitle;
      }
    } else {
      const { data } = await supabase
        .from("trip_tracking")
        .select("trip_id, total_distance_km, trips(destination, arrival_city)")
        .eq("share_slug", slug)
        .eq("share_enabled", true)
        .maybeSingle();
      if (data) {
        const trip = (data as any).trips;
        title = trip?.destination || trip?.arrival_city || "Suivi en direct";
        subtitle = `${Number((data as any).total_distance_km || 0).toFixed(1)} km parcourus · live`;
      }
    }

    const svg = svgImage({ title, subtitle, kind });
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("og-image error", e);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
