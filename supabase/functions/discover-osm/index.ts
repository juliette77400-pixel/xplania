import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map OSM tags -> our category
function mapCategory(tags: Record<string, string>): { category: string; subcategory?: string } {
  const a = tags.amenity;
  const t = tags.tourism;
  const l = tags.leisure;
  const s = tags.shop;
  if (a === "cafe" || a === "restaurant" || a === "bar" || a === "pub" || a === "fast_food" || a === "ice_cream" || a === "biergarten") {
    return { category: "food", subcategory: a };
  }
  if (a === "nightclub" || a === "casino") return { category: "nightlife", subcategory: a };
  if (t === "museum" || t === "gallery" || t === "artwork" || t === "attraction" || a === "theatre" || a === "cinema") {
    return { category: "culture", subcategory: t || a };
  }
  if (l === "park" || l === "garden" || t === "viewpoint" || l === "nature_reserve") {
    return { category: "nature", subcategory: l || t };
  }
  if (a === "library" || a === "coworking_space" || t === "hotel") return { category: "chill", subcategory: a || t };
  if (s) return { category: "experience", subcategory: s };
  return { category: "experience" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await requireAuth(req, corsHeaders);
  if (__auth instanceof Response) return __auth;


  try {
    const { lat, lng, radius = 1500, category } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "lat/lng required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build Overpass filters depending on category
    const filterMap: Record<string, string> = {
      food: '["amenity"~"cafe|restaurant|bar|pub|ice_cream|biergarten"]',
      nightlife: '["amenity"~"nightclub|bar|pub"]',
      culture: '["tourism"~"museum|gallery|artwork|attraction"]',
      nature: '["leisure"~"park|garden|nature_reserve"]',
      chill: '["amenity"~"library|cafe"]',
      experience: '["tourism"~"attraction|viewpoint"]',
      all: '["amenity"~"cafe|restaurant|bar|pub|library"]',
    };
    const filter = filterMap[category as string] || filterMap.all;
    const query = `[out:json][timeout:20];(
      node${filter}(around:${radius},${lat},${lng});
      way${filter}(around:${radius},${lat},${lng});
    );out center 60;`;

    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.openstreetmap.ru/api/interpreter",
    ];
    let ov: any = null;
    let lastErr = "";
    for (const url of endpoints) {
      try {
        const ovResp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain", "User-Agent": "Xplania/1.0" },
          body: query,
        });
        if (ovResp.ok) { ov = await ovResp.json(); break; }
        lastErr = `${url} ${ovResp.status}`;
        console.error("Overpass error", lastErr, (await ovResp.text()).slice(0, 200));
      } catch (e) {
        lastErr = `${url} ${e instanceof Error ? e.message : "fetch fail"}`;
        console.error("Overpass fetch fail", lastErr);
      }
    }
    if (!ov) {
      return new Response(JSON.stringify({ inserted: 0, places: [], warning: "Overpass unavailable", detail: lastErr }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const rows: any[] = [];
    for (const el of (ov.elements || []) as any[]) {
      const plat = el.lat ?? el.center?.lat;
      const plng = el.lon ?? el.center?.lon;
      if (plat == null || plng == null) continue;
      const tags = el.tags || {};
      const name = tags.name || tags["name:en"] || tags["name:fr"];
      if (!name) continue;
      const cat = mapCategory(tags);
      rows.push({
        source: "osm",
        osm_id: `${el.type}/${el.id}`,
        name,
        category: cat.category,
        subcategory: cat.subcategory ?? null,
        lat: plat,
        lng: plng,
        address: tags["addr:street"] ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}, ${tags["addr:city"] || ""}`.trim() : null,
        opening_hours: tags.opening_hours ? { raw: tags.opening_hours } : null,
        tags: [cat.category, cat.subcategory].filter(Boolean) as string[],
        score: 50,
      });
    }

    if (rows.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, places: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data, error } = await supa.from("places").upsert(rows, { onConflict: "source,osm_id", ignoreDuplicates: false }).select("id,name,category,subcategory,lat,lng,tags,address,image_url,description,why_fits,hidden_gem,score,rating_avg,rating_count");
    if (error) {
      console.error("Upsert error", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ inserted: data?.length ?? 0, places: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("discover-osm error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
