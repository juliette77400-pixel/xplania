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
