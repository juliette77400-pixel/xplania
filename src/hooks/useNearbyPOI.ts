import { useEffect, useState } from "react";

export interface NearbyPOI {
  id: string;
  name: string;
  category: "food" | "culture" | "nature" | "shopping" | "nightlife" | "hidden_gem";
  lat: number;
  lng: number;
  tags: Record<string, string>;
}

const CATEGORY_QUERY = `
  node["amenity"~"^(restaurant|cafe|bar|pub|fast_food|biergarten|ice_cream)$"](around:RADIUS,LAT,LNG);
  node["tourism"~"^(museum|attraction|gallery|artwork|viewpoint|monument)$"](around:RADIUS,LAT,LNG);
  node["historic"](around:RADIUS,LAT,LNG);
  node["leisure"~"^(park|garden|nature_reserve)$"](around:RADIUS,LAT,LNG);
  node["shop"~"^(mall|department_store|gift|books|clothes|bakery)$"](around:RADIUS,LAT,LNG);
  node["amenity"="nightclub"](around:RADIUS,LAT,LNG);
`;

function classify(tags: Record<string, string>): NearbyPOI["category"] {
  if (tags.amenity === "nightclub" || tags.amenity === "bar" || tags.amenity === "pub") return "nightlife";
  if (["restaurant", "cafe", "fast_food", "biergarten", "ice_cream"].includes(tags.amenity)) return "food";
  if (tags.tourism || tags.historic) return "culture";
  if (tags.leisure) return "nature";
  if (tags.shop) return "shopping";
  return "hidden_gem";
}

const cache = new Map<string, NearbyPOI[]>();

/**
 * Fetch nearby points of interest from OpenStreetMap Overpass API.
 * Free, no API key required. Cached in-memory + sessionStorage.
 */
export function useNearbyPOI(
  position: { lat: number; lng: number } | null,
  enabled: boolean,
  radiusMeters = 600,
) {
  const [pois, setPois] = useState<NearbyPOI[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !position) return;
    // Round to ~100m grid to maximize cache hits
    const key = `${position.lat.toFixed(3)}_${position.lng.toFixed(3)}_${radiusMeters}`;

    if (cache.has(key)) { setPois(cache.get(key)!); return; }
    try {
      const cached = sessionStorage.getItem(`poi:${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        cache.set(key, parsed);
        setPois(parsed);
        return;
      }
    } catch {}

    let cancelled = false;
    setLoading(true);
    const query = `[out:json][timeout:15];(${CATEGORY_QUERY
      .replace(/RADIUS/g, String(radiusMeters))
      .replace(/LAT/g, position.lat.toFixed(6))
      .replace(/LNG/g, position.lng.toFixed(6))});out body 60;`;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        if (cancelled) return;
        const elems = (json?.elements || []) as Array<{
          id: number; lat: number; lon: number; tags?: Record<string, string>;
        }>;
        const list: NearbyPOI[] = elems
          .filter((e) => e.tags?.name)
          .map((e) => ({
            id: String(e.id),
            name: e.tags!.name,
            category: classify(e.tags!),
            lat: e.lat,
            lng: e.lon,
            tags: e.tags!,
          }))
          .slice(0, 50);
        cache.set(key, list);
        try { sessionStorage.setItem(`poi:${key}`, JSON.stringify(list)); } catch {}
        setPois(list);
      })
      .catch(() => { if (!cancelled) setPois([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [position?.lat, position?.lng, enabled, radiusMeters]);

  return { pois, loading };
}

export const POI_COLORS: Record<NearbyPOI["category"], string> = {
  food: "#f97316",
  culture: "#a855f7",
  nature: "#22c55e",
  shopping: "#ec4899",
  nightlife: "#6366f1",
  hidden_gem: "#eab308",
};

export const POI_LABELS: Record<NearbyPOI["category"], string> = {
  food: "🍴 Restaurant",
  culture: "🏛 Culture",
  nature: "🌿 Nature",
  shopping: "🛍 Shopping",
  nightlife: "🌙 Nightlife",
  hidden_gem: "💎 Hidden gem",
};
