// Hand-written housing resources. Only real services whose link was opened and
// checked on VERIFIED_ON are listed — never AI-generated. No partnership with
// any of them. Descriptions live in i18n under housing.resources.items.<id>.

export type ResourceCategory = "residence" | "platform" | "flatshare" | "money" | "fraud" | "institutional";

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

  // Official European help: grants, consumer rights, disputes.
  { id: "erasmusplus", name: "Erasmus+ (Commission européenne)", url: "https://erasmus-plus.ec.europa.eu/fr/opportunities/opportunities-for-individuals/students", category: "money", countries: ["EU"] },
  { id: "eccnet", name: "Centres européens des consommateurs (ECC-Net)", url: "https://www.eccnet.eu", category: "fraud", countries: ["EU"] },
  { id: "youreurope", name: "L'Europe est à vous (Your Europe)", url: "https://europa.eu/youreurope/citizens/consumers/unfair-treatment/index_fr.htm", category: "fraud", countries: ["EU"] },
  // Student association (not a public body) — local sections welcome incoming Erasmus students.
  { id: "esn", name: "Erasmus Student Network (ESN)", url: "https://esn.org/sections", category: "institutional", countries: ["EU"] },
  { id: "youthportal", name: "Portail européen de la jeunesse", url: "https://youth.europa.eu/home_fr", category: "institutional", countries: ["EU"] },

  // France
  { id: "crous", name: "Crous — messervices.etudiant.gouv.fr", url: "https://messervices.etudiant.gouv.fr", category: "residence", countries: ["FR"] },
  { id: "cartedescolocs", name: "La Carte des Colocs", url: "https://www.lacartedescolocs.fr", category: "flatshare", countries: ["FR"] },
  { id: "visale", name: "Visale (Action Logement)", url: "https://www.visale.fr", category: "money", countries: ["FR"] },
  { id: "caf", name: "CAF", url: "https://www.caf.fr", category: "money", countries: ["FR"] },
  { id: "anil", name: "ANIL / ADIL", url: "https://www.anil.org", category: "institutional", countries: ["FR"] },

  // Spain
  { id: "fotocasa", name: "Fotocasa", url: "https://www.fotocasa.es/es/", category: "platform", countries: ["ES"] },
  { id: "badi", name: "Badi", url: "https://badi.com", category: "flatshare", countries: ["ES"] },

  // Germany
  { id: "studierendenwerke", name: "Studierendenwerke", url: "https://www.studierendenwerke.de/themen/wohnen", category: "residence", countries: ["DE"] },
  { id: "wggesucht", name: "WG-Gesucht", url: "https://www.wg-gesucht.de/en/", category: "flatshare", countries: ["DE"] },

  // Netherlands
  { id: "kamernet", name: "Kamernet", url: "https://kamernet.nl/en", category: "platform", countries: ["NL"] },
  { id: "huurcommissie", name: "Huurcommissie", url: "https://www.huurcommissie.nl", category: "fraud", countries: ["NL"] },
  { id: "duwo", name: "DUWO", url: "https://www.duwo.nl", category: "residence", countries: ["NL"] },
  { id: "ssh", name: "SSH Student Housing", url: "https://www.sshxl.nl", category: "residence", countries: ["NL"] },

  // United Kingdom
  { id: "spareroom", name: "SpareRoom", url: "https://www.spareroom.co.uk", category: "flatshare", countries: ["GB"] },
  { id: "unite", name: "Unite Students", url: "https://www.unitestudents.com", category: "residence", countries: ["GB"] },
  { id: "howtorent", name: "GOV.UK — How to rent", url: "https://www.gov.uk/government/publications/how-to-rent", category: "institutional", countries: ["GB"] },
  { id: "reportfraud", name: "Report Fraud (UK police)", url: "https://www.reportfraud.police.uk", category: "fraud", countries: ["GB"] },
  { id: "shelter", name: "Shelter", url: "https://england.shelter.org.uk", category: "institutional", countries: ["GB"] },
  { id: "citizensadvice", name: "Citizens Advice — Housing", url: "https://www.citizensadvice.org.uk/housing/", category: "institutional", countries: ["GB"] },
  { id: "ucas", name: "UCAS — Student accommodation", url: "https://www.ucas.com/accommodation", category: "institutional", countries: ["GB"] },

  // Ireland
  { id: "threshold", name: "Threshold", url: "https://www.threshold.ie", category: "institutional", countries: ["IE"] },
  { id: "rtb", name: "Residential Tenancies Board (RTB)", url: "https://rtb.ie", category: "fraud", countries: ["IE"] },

  // Poland
  { id: "otodom", name: "Otodom", url: "https://www.otodom.pl", category: "platform", countries: ["PL"] },

  // Canada
  { id: "cmhc", name: "SCHL / CMHC", url: "https://www.cmhc-schl.gc.ca", category: "institutional", countries: ["CA"] },
  { id: "antifraudca", name: "Centre antifraude du Canada", url: "https://antifraudcentre-centreantifraude.ca", category: "fraud", countries: ["CA"] },

  // Australia
  { id: "studyaustralia", name: "Study Australia (Australian Government)", url: "https://www.studyaustralia.gov.au", category: "institutional", countries: ["AU"] },

  // Added 28 Oct 2026 — opened and checked by hand.
  { id: "studyindenmark", name: "Study in Denmark (gouvernement danois)", url: "https://studyindenmark.dk", category: "institutional", countries: ["DK"] },
  { id: "studyinsweden", name: "Study in Sweden (Swedish Institute)", url: "https://studyinsweden.se", category: "institutional", countries: ["SE"] },
  { id: "sssb", name: "SSSB — logements étudiants de Stockholm", url: "https://www.sssb.se", category: "residence", countries: ["SE"] },
  { id: "studyinnorway", name: "Study in Norway", url: "https://studyinnorway.no", category: "institutional", countries: ["NO"] },
  { id: "finn", name: "FINN.no", url: "https://www.finn.no", category: "platform", countries: ["NO"] },
  { id: "studyinaustria", name: "Study in Austria (OeAD)", url: "https://studyinaustria.at/en", category: "institutional", countries: ["AT"] },
  { id: "oeadhousing", name: "OeAD Student Housing", url: "https://www.oeadstudenthousing.at", category: "residence", countries: ["AT"] },
  { id: "wgzimmer", name: "WGZimmer.ch", url: "https://www.wgzimmer.ch", category: "flatshare", countries: ["CH"] },
  { id: "studyinswitzerland", name: "Study in Switzerland (swissuniversities)", url: "https://www.studyinswitzerland.plus", category: "institutional", countries: ["CH"] },
  { id: "daft", name: "Daft.ie", url: "https://www.daft.ie", category: "platform", countries: ["IE"] },
  { id: "tenancynz", name: "Tenancy Services (gouvernement néo-zélandais)", url: "https://www.tenancy.govt.nz", category: "institutional", countries: ["NZ"] },
  { id: "trademe", name: "Trade Me Property", url: "https://www.trademe.co.nz/a/property/residential/rent", category: "platform", countries: ["NZ"] },
  { id: "studyinkorea", name: "Study in Korea (gouvernement coréen)", url: "https://www.studyinkorea.go.kr", category: "institutional", countries: ["KR"] },
  { id: "studyinindia", name: "Study in India (gouvernement indien)", url: "https://www.studyinindia.gov.in", category: "institutional", countries: ["IN"] },
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

// French overseas departments use the French schemes (CROUS, CAF, Visale…). Mayotte is left out:
// its benefits are run by its own social security fund.
const FRENCH_OVERSEAS = new Set(["RE", "GP", "MQ", "GF"]);

export function resourcesForCountry(code: string | null | undefined): ResourcesForCountry {
  const raw = (code || "").toUpperCase();
  const c = FRENCH_OVERSEAS.has(raw) ? "FR" : raw;
  return {
    local: c ? HOUSING_RESOURCES.filter((r) => r.countries.includes(c)) : [],
    european: EUROPE.has(c) ? HOUSING_RESOURCES.filter((r) => r.countries.includes("EU")) : [],
  };
}
