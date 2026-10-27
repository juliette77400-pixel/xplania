// Finds the coordinates used for a student's city (Open-Meteo geocoding, no key, called server-side).
// An island or a region ("Gran Canaria") is resolved to a town or its airport instead of the
// geographic centre: the centre can sit on a 1 700 m peak whose weather has nothing to do with
// where people live (cold, hail…).
export interface Place { name: string; region: string; country: string; countryCode: string; latitude: number; longitude: number; elevation: number | null; kind: "town" | "airport" | "area" }

const AREA_CODES = /^(ISL|ISLS|ADM\d?|ADMD|RGN|AREA|MT|MTS|PK|HLL|PRK|RESV)$/;

export function pickPlace(results: Array<Record<string, unknown>>): Record<string, unknown> | null {
  if (!results.length) return null;
  const code = (r: Record<string, unknown>) => String(r.feature_code || "");
  const first = results[0];
  if (code(first).startsWith("PPL")) return first;
  const elevationHigh = typeof first.elevation === "number" && first.elevation > 800;
  if (AREA_CODES.test(code(first)) || elevationHigh) {
    return results.find((r) => code(r).startsWith("PPL")) || results.find((r) => code(r) === "AIRP") || first;
  }
  return first;
}

export async function lookupPlace(city: string, countryCode: string, lang: "fr" | "en"): Promise<Place | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=${lang}${countryCode ? `&countryCode=${countryCode}` : ""}`;
  const geo = await fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const p = pickPlace(Array.isArray(geo?.results) ? geo.results : []);
  if (!p) return null;
  const fc = String(p.feature_code || "");
  return {
    name: String(p.name || city),
    region: String(p.admin1 || ""),
    country: String(p.country || ""),
    countryCode: String(p.country_code || countryCode || ""),
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    elevation: typeof p.elevation === "number" ? p.elevation : null,
    kind: fc.startsWith("PPL") ? "town" : fc === "AIRP" ? "airport" : "area",
  };
}
