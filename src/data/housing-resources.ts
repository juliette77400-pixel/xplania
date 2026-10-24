// Hand-written housing resources. Only real services whose link was opened and
// checked on VERIFIED_ON are listed — never AI-generated. No partnership with
// any of them. Descriptions live in i18n under housing.resources.items.<id>.

export type ResourceCategory = "residence" | "platform" | "flatshare" | "institutional";

export interface HousingResource {
  id: string;
  name: string;
  url: string;
  category: ResourceCategory;
  /** ISO country codes, or "EU" for services present in several European countries. */
  countries: string[];
}

export const VERIFIED_ON = "2026-10-24";

export const HOUSING_RESOURCES: HousingResource[] = [
  // Several European countries — coverage varies by city.
  { id: "housinganywhere", name: "HousingAnywhere", url: "https://housinganywhere.com", category: "platform", countries: ["EU"] },
  { id: "uniplaces", name: "Uniplaces", url: "https://www.uniplaces.com", category: "platform", countries: ["EU"] },
  { id: "spotahome", name: "Spotahome", url: "https://www.spotahome.com", category: "platform", countries: ["EU"] },
  { id: "erasmusu", name: "Erasmusu", url: "https://erasmusu.com", category: "flatshare", countries: ["EU"] },

  // France
  { id: "crous", name: "Crous — messervices.etudiant.gouv.fr", url: "https://messervices.etudiant.gouv.fr", category: "residence", countries: ["FR"] },
  { id: "cartedescolocs", name: "La Carte des Colocs", url: "https://www.lacartedescolocs.fr", category: "flatshare", countries: ["FR"] },
  { id: "visale", name: "Visale (Action Logement)", url: "https://www.visale.fr", category: "institutional", countries: ["FR"] },
  { id: "caf", name: "CAF", url: "https://www.caf.fr", category: "institutional", countries: ["FR"] },

  // Spain
  { id: "fotocasa", name: "Fotocasa", url: "https://www.fotocasa.es", category: "platform", countries: ["ES"] },
  { id: "badi", name: "Badi", url: "https://badi.com", category: "flatshare", countries: ["ES"] },

  // Germany
  { id: "studierendenwerke", name: "Studierendenwerke", url: "https://www.studierendenwerke.de/themen/wohnen", category: "residence", countries: ["DE"] },
  { id: "wggesucht", name: "WG-Gesucht", url: "https://www.wg-gesucht.de/en/", category: "flatshare", countries: ["DE"] },

  // Netherlands
  { id: "kamernet", name: "Kamernet", url: "https://kamernet.nl/en", category: "platform", countries: ["NL"] },
  { id: "duwo", name: "DUWO", url: "https://www.duwo.nl", category: "residence", countries: ["NL"] },
  { id: "ssh", name: "SSH Student Housing", url: "https://www.sshxl.nl", category: "residence", countries: ["NL"] },

  // United Kingdom
  { id: "spareroom", name: "SpareRoom", url: "https://www.spareroom.co.uk", category: "flatshare", countries: ["GB"] },
  { id: "unite", name: "Unite Students", url: "https://www.unitestudents.com", category: "residence", countries: ["GB"] },
  { id: "howtorent", name: "GOV.UK — How to rent", url: "https://www.gov.uk/government/publications/how-to-rent", category: "institutional", countries: ["GB"] },
  { id: "reportfraud", name: "Report Fraud (UK police)", url: "https://www.reportfraud.police.uk", category: "institutional", countries: ["GB"] },

  // Poland
  { id: "otodom", name: "Otodom", url: "https://www.otodom.pl", category: "platform", countries: ["PL"] },

  // Australia
  { id: "studyaustralia", name: "Study Australia (Australian Government)", url: "https://www.studyaustralia.gov.au", category: "institutional", countries: ["AU"] },
];

/** Countries where the multi-country European platforms operate (indicative). */
const EUROPE = new Set([
  "AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IT",
  "LT", "LU", "LV", "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK",
]);

export interface ResourcesForCountry {
  local: HousingResource[];
  european: HousingResource[];
}

export function resourcesForCountry(code: string | null | undefined): ResourcesForCountry {
  const c = (code || "").toUpperCase();
  return {
    local: c ? HOUSING_RESOURCES.filter((r) => r.countries.includes(c)) : [],
    european: EUROPE.has(c) ? HOUSING_RESOURCES.filter((r) => r.countries.includes("EU")) : [],
  };
}
