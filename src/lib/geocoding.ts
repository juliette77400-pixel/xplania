// Lightweight geocoding using Komoot Photon (free, OSM-based, Google-Maps-like).
// No API key required. Returns ranked suggestions for an autocomplete input.

export interface GeoSuggestion {
  label: string;
  name: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
  type?: string;
}

const PHOTON = "https://photon.komoot.io/api/";

/** Search places by free-text. Optionally bias toward a location. */
export async function searchPhoton(
  query: string,
  opts: { lat?: number; lng?: number; limit?: number; lang?: string } = {}
): Promise<GeoSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    q,
    limit: String(opts.limit ?? 8),
    lang: opts.lang ?? "fr",
  });
  if (opts.lat != null && opts.lng != null) {
    params.set("lat", String(opts.lat));
    params.set("lon", String(opts.lng));
  }
  const res = await fetch(`${PHOTON}?${params.toString()}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.features || []).map((f: any): GeoSuggestion => {
    const p = f.properties || {};
    const [lng, lat] = f.geometry?.coordinates || [0, 0];
    const parts = [p.name, p.city || p.town || p.village, p.country].filter(Boolean);
    return {
      label: parts.join(", "),
      name: p.name || "",
      city: p.city || p.town || p.village,
      country: p.country,
      lat,
      lng,
      type: p.osm_value || p.type,
    };
  });
}

/** IP-based fallback when GPS is denied/unavailable. */
export async function ipGeolocate(): Promise<{ lat: number; lng: number; city?: string } | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const j = await res.json();
    if (typeof j.latitude !== "number" || typeof j.longitude !== "number") return null;
    return { lat: j.latitude, lng: j.longitude, city: j.city };
  } catch {
    return null;
  }
}

/** Strip country/region noise so that OpenWeather's q= search resolves. */
export function cleanCityForWeather(input: string): string {
  if (!input) return input;
  // Keep only the first comma-separated chunk and strip parenthesised regions.
  return input.split(",")[0].replace(/\s*\([^)]*\)\s*/g, "").trim();
}
