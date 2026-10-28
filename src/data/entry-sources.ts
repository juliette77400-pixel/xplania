// Official entry / visa sites of destination countries, checked by hand on
// 24 Oct 2026 (government domains only). Used for students who are not French
// nationals: the AI answer is only a lead, the rule comes from these sites.
import { FREE_MOVEMENT } from "@/lib/visa-rules";

export interface EntrySource {
  label: string;
  url: string;
}

export const ENTRY_SOURCES_CHECKED_ON = "2026-10-24";

const SITES: Record<string, EntrySource> = {
  GB: { label: "GOV.UK — Check if you need a UK visa", url: "https://www.gov.uk/check-uk-visa" },
  US: { label: "U.S. Department of State — Visas", url: "https://travel.state.gov/content/travel/en/us-visas.html" },
  CA: { label: "Gouvernement du Canada — Ai-je besoin d'un visa ou d'une AVE ?", url: "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada/verifiez-visa-ave.html" },
  AU: { label: "Australian Government — Visa Finder", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder" },
  NZ: { label: "Immigration New Zealand — Visas", url: "https://www.immigration.govt.nz/new-zealand-visas" },
  JP: { label: "Ministry of Foreign Affairs of Japan — Visa", url: "https://www.mofa.go.jp/j_info/visit/visa/index.html" },
  KR: { label: "Korea Visa Portal", url: "https://www.visa.go.kr/" },
  CN: { label: "China Visa Application Service Center", url: "https://www.visaforchina.cn/" },
  SG: { label: "ICA Singapore — Visa requirements", url: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements" },
  IN: { label: "Government of India — Indian Visa Online", url: "https://indianvisaonline.gov.in/" },
  TH: { label: "Thailand — Official e-Visa", url: "https://www.thaievisa.go.th/" },
  AE: { label: "UAE Government — Visa and Emirates ID", url: "https://u.ae/en/information-and-services/visa-and-emirates-id" },
  CH: { label: "Secrétariat d'État aux migrations (Suisse) — Entrée", url: "https://www.sem.admin.ch/sem/en/home/themen/einreise.html" },
  MX: { label: "Gobierno de México — Visas para extranjeros", url: "https://www.gob.mx/sre/acciones-y-programas/visas-para-extranjeros" },
  BR: { label: "Itamaraty (Brésil) — Vistos", url: "https://www.gov.br/mre/pt-br/assuntos/portal-consular/vistos" },
  AR: { label: "Argentina — Dirección Nacional de Migraciones", url: "https://www.argentina.gob.ar/interior/migraciones" },
  CL: { label: "Chile — Servicio Nacional de Migraciones", url: "https://serviciomigraciones.cl/" },
  PE: { label: "Perú — Migraciones", url: "https://www.gob.pe/migraciones" },
  CO: { label: "Cancillería de Colombia — Visas", url: "https://www.cancilleria.gov.co/tramites_servicios/visa" },
  MA: { label: "Royaume du Maroc — Visa", url: "https://www.consulat.ma/fr/visa" },
  TR: { label: "République de Türkiye — e-Visa officiel", url: "https://www.evisa.gov.tr/" },
  IE: { label: "Irish Immigration Service — Studying in Ireland", url: "https://www.irishimmigration.ie/coming-to-study-in-ireland/" },
};

const SCHENGEN_EU: EntrySource = {
  label: "Commission européenne — Politique des visas Schengen",
  url: "https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en",
};

/** Official site to check entry rules for a destination, or null when none was checked by hand. */
export function entrySourceFor(destinationCode: string | null | undefined): EntrySource | null {
  const c = (destinationCode || "").toUpperCase();
  if (SITES[c]) return SITES[c];
  if (FREE_MOVEMENT.has(c)) return SCHENGEN_EU;
  return null;
}
