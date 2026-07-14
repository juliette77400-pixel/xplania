import { useQuery } from "@tanstack/react-query";
import { useStableCoords } from "@/hooks/useStableCallback";

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

async function fetchOverpass(
  position: { lat: number; lng: number },
  radiusMeters: number,
): Promise<NearbyPOI[]> {
  const query = `[out:json][timeout:15];(${CATEGORY_QUERY
    .replace(/RADIUS/g, String(radiusMeters))
    .replace(/LAT/g, position.lat.toFixed(6))
    .replace(/LNG/g, position.lng.toFixed(6))});out body 60;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
  });
  if (!res.ok) throw new Error("overpass_failed");
  const json = await res.json();
  const elems = (json?.elements || []) as Array<{
    id: number; lat: number; lon: number; tags?: Record<string, string>;
  }>;
  return elems
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
}

/**
 * Fetch nearby points of interest from OpenStreetMap Overpass API via React
 * Query. Positions are quantized to a ~100 m grid (via `useStableCoords`) so
 * small GPS drift doesn't invalidate the cache; results are shared across
 * consumers thanks to the React Query cache.
 */
export function useNearbyPOI(
  position: { lat: number; lng: number } | null,
  enabled: boolean,
  radiusMeters = 600,
) {
  const stable = useStableCoords(position, 100);
  const key = stable
    ? `${stable.lat.toFixed(3)}_${stable.lng.toFixed(3)}_${radiusMeters}`
    : null;

  const { data, isLoading } = useQuery({
    queryKey: ["nearby-poi", key],
    enabled: enabled && !!stable,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
    queryFn: () => fetchOverpass(stable!, radiusMeters),
  });

  return { pois: data ?? [], loading: enabled && !!stable && isLoading };
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
