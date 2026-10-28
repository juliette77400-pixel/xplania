import { countryList, englishCountryNames, getCountryNameIn } from "@/lib/countries";

export const normCountry = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const ALIASES: Record<string, string> = {
  angleterre: "GB", "royaume-uni": "GB", england: "GB", uk: "GB", "united kingdom": "GB", ecosse: "GB",
  usa: "US", "etats-unis": "US", amerique: "US", "united states": "US", japan: "JP", china: "CN", brazil: "BR",
  mexico: "MX", spain: "ES", poland: "PL", netherlands: "NL", hollande: "NL", holland: "NL", australia: "AU", germany: "DE",
  coree: "KR", korea: "KR", "nouvelle zelande": "NZ", suisse: "CH",
};

/** Resolves free text (country name, alias or ISO code) to an ISO country code. */
export function findCountry(q: string | null | undefined): string | null {
  if (!q) return null;
  const n = normCountry(q);
  if (!n) return null;
  if (ALIASES[n]) return ALIASES[n];
  const byCode = countryList.find((c) => c.code.toLowerCase() === n);
  if (byCode) return byCode.code;
  const exact = countryList.find((c) => normCountry(c.name) === n);
  if (exact) return exact.code;
  // English names ("Sweden", "South Korea"), for trips typed in English.
  const english = englishCountryNames.find((c) => c.names.some((name) => normCountry(name) === n));
  if (english) return english.code;
  const starts = countryList.filter((c) => normCountry(c.name).startsWith(n));
  return starts.length === 1 ? starts[0].code : null;
}

/**
 * Display name of a saved destination in the interface language: a bare country name typed in
 * French ("Espagne") shows as "Spain" in English. Cities and free text are shown as typed.
 */
export function placeName(name: string | null | undefined, lang: string | undefined): string {
  if (!name) return "";
  if (!lang?.startsWith("en")) return name;
  const n = normCountry(name);
  const exact = countryList.find((c) => normCountry(c.name) === n) ?? (ALIASES[n] ? { code: ALIASES[n] } : null);
  return exact ? getCountryNameIn(exact.code, "en") : name;
}
