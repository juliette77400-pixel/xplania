import countries from "i18n-iso-countries";
import frLocale from "i18n-iso-countries/langs/fr.json";

// Register French locale
countries.registerLocale(frLocale);

export interface CountryOption {
  code: string;
  name: string;
}

/**
 * Returns all countries sorted alphabetically in French.
 */
export function getAllCountries(): CountryOption[] {
  const names = countries.getNames("fr", { select: "official" });
  return Object.entries(names)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/**
 * Returns a country name by its ISO code, in French.
 */
export function getCountryName(code: string): string {
  return countries.getName(code, "fr", { select: "official" }) || code;
}

// Pre-computed list for performance
export const countryList = getAllCountries();

const displayNames: Partial<Record<"fr" | "en", Intl.DisplayNames>> = {};
/**
 * Country name in the interface language (English names in English), French as a fallback.
 * Use for display only; lookups and search keep the French list above.
 */
export function getCountryNameIn(code: string, lang: string | undefined): string {
  const l: "fr" | "en" = lang?.startsWith("en") ? "en" : "fr";
  if (l === "fr") return getCountryName(code);
  try {
    displayNames[l] ??= new Intl.DisplayNames([l], { type: "region" });
    return displayNames[l]!.of(code.toUpperCase()) || getCountryName(code);
  } catch {
    return getCountryName(code);
  }
}
