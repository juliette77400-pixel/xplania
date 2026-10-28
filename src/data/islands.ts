// Islands and overseas territories whose rules or daily life differ from the mainland
// of the country (hand-written, no AI). Texts live in i18n under islands.items.<id>;
// every link is hand-checked and listed in supabase/functions/_shared/checked-links.ts.
// Same normalisation as country-match (kept local so country-match can import this file).
const normCountry = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export type IslandKind = "overseas" | "special" | "same";

export interface IslandLink { label: string; url: string }

export interface Island {
  /** i18n key: islands.items.<id> */
  id: string;
  /** Country the island belongs to (FR for French overseas territories). */
  parent: string;
  /** Own ISO codes when the country list offers them (Réunion = RE…). */
  codes?: string[];
  /** Island / territory names and main towns, FR and EN (matched as whole words). */
  names: string[];
  kind: IslandKind;
  links: IslandLink[];
}

export const ISLANDS_CHECKED_ON = "2026-10-28";

const SP_OUTREMER: IslandLink = { label: "Service-Public — visa pour l'outre-mer (étrangers)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F10610" };
const DOUANE_COLIS: IslandLink = { label: "Douane — envoyer un colis", url: "https://www.douane.gouv.fr/fiche/envoyer-un-colis-un-particulier" };
const PASTEUR = "https://www.pasteur.fr/fr/votre-sante/voyages-et-sante/recommandations-sanitaires-par-pays/";
const FD = (slug: string): IslandLink => ({ label: "France Diplomatie — entrée / séjour", url: `https://www.diplomatie.gouv.fr/fr/information-par-pays/${slug}/conseils-aux-voyageurs-entree-sejour` });

/** Institut Pasteur page of each French overseas territory (checked by hand). */
export const OVERSEAS_PASTEUR: Record<string, string> = {
  RE: `${PASTEUR}reunion-ile-de-la`,
  GP: `${PASTEUR}guadeloupe`,
  MQ: `${PASTEUR}martinique`,
  YT: `${PASTEUR}mayotte`,
  GF: `${PASTEUR}guyane`,
  NC: `${PASTEUR}nouvelle-caledonie`,
  PF: `${PASTEUR}polynesie-francaise`,
};

export const ISLANDS: Island[] = [
  {
    id: "drom", parent: "FR", codes: ["RE", "GP", "MQ", "YT", "GF"], kind: "overseas",
    names: ["la reunion", "reunion", "saint-denis de la reunion", "saint-pierre de la reunion", "guadeloupe", "pointe-a-pitre", "basse-terre",
      "martinique", "fort-de-france", "mayotte", "mamoudzou", "guyane", "guyane francaise", "french guiana", "cayenne", "kourou"],
    links: [SP_OUTREMER, DOUANE_COLIS],
  },
  {
    id: "pacific", parent: "FR", codes: ["NC", "PF", "WF"], kind: "overseas",
    names: ["nouvelle-caledonie", "nouvelle caledonie", "new caledonia", "noumea", "polynesie francaise", "polynesie", "french polynesia",
      "tahiti", "papeete", "moorea", "bora-bora", "wallis-et-futuna", "wallis et futuna"],
    links: [SP_OUTREMER, DOUANE_COLIS, { label: "CAFAT (Nouvelle-Calédonie)", url: "https://www.cafat.nc/" }, { label: "CPS (Polynésie française)", url: "https://www.cps.pf/" }],
  },
  {
    id: "canaries", parent: "ES", kind: "special",
    names: ["canaries", "iles canaries", "canarias", "islas canarias", "canary islands", "tenerife", "gran canaria", "las palmas",
      "lanzarote", "fuerteventura", "la palma", "la gomera", "el hierro", "santa cruz de tenerife"],
    links: [FD("espagne"), DOUANE_COLIS],
  },
  {
    id: "baleares", parent: "ES", kind: "same",
    names: ["baleares", "iles baleares", "balearic islands", "illes balears", "majorque", "mallorca", "majorca", "palma de majorque",
      "palma de mallorca", "minorque", "menorca", "ibiza", "eivissa", "formentera"],
    links: [FD("espagne")],
  },
  {
    id: "madeira_azores", parent: "PT", kind: "same",
    names: ["madere", "madeira", "funchal", "acores", "azores", "ponta delgada", "sao miguel", "terceira"],
    links: [FD("portugal")],
  },
  {
    id: "sicily_sardinia", parent: "IT", kind: "same",
    names: ["sicile", "sicily", "sicilia", "palerme", "palermo", "catane", "catania", "messine", "messina", "sardaigne", "sardinia", "sardegna", "cagliari", "sassari"],
    links: [FD("italie")],
  },
  {
    id: "greek_islands", parent: "GR", kind: "same",
    names: ["crete", "heraklion", "la canee", "chania", "rhodes", "corfou", "corfu", "santorin", "santorini", "mykonos", "naxos", "paros",
      "lesbos", "mytilene", "chios", "samos", "kos", "zakynthos", "zante", "cephalonie", "kefalonia", "cyclades", "dodecanese"],
    links: [FD("grece")],
  },
  {
    id: "faroe_greenland", parent: "DK", codes: ["FO", "GL"], kind: "special",
    names: ["iles feroe", "feroe", "faroe islands", "faroe", "torshavn", "groenland", "greenland", "nuuk"],
    links: [FD("danemark")],
  },
  {
    id: "svalbard", parent: "NO", codes: ["SJ"], kind: "special",
    names: ["svalbard", "spitzberg", "spitsbergen", "longyearbyen"],
    links: [{ label: "Sysselmesteren (gouverneur du Svalbard) — entry and residence", url: "https://www.sysselmesteren.no/en/entry-and-residence/" }],
  },
  {
    id: "rapa_nui", parent: "CL", kind: "special",
    names: ["ile de paques", "easter island", "rapa nui", "isla de pascua", "hanga roa"],
    links: [FD("chili")],
  },
  {
    id: "bali", parent: "ID", kind: "special",
    names: ["bali", "denpasar", "ubud", "canggu", "seminyak", "kuta"],
    links: [FD("indonesie"), { label: "Love Bali — gouvernement de Bali (taxe touristique)", url: "https://lovebali.baliprov.go.id/" }],
  },
];

const hasWord = (text: string, word: string) =>
  new RegExp(`(^|[^a-z])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(text);

/** Island or territory named in the destination or the arrival city, if any. */
export function islandFor(destination?: string | null, city?: string | null, code?: string | null): Island | null {
  const c = (code || "").toUpperCase();
  if (c) {
    const byCode = ISLANDS.find((i) => i.codes?.includes(c));
    if (byCode) return byCode;
  }
  const text = normCountry([city, destination].filter(Boolean).join(" , "));
  if (!text) return null;
  return ISLANDS.find((i) => i.names.some((n) => hasWord(text, normCountry(n)))) ?? null;
}

/** Islands listed on the public guide of a country. */
export const islandsOf = (countryCode: string) => ISLANDS.filter((i) => i.parent === countryCode);

/** Every external link shown for islands (kept in the daily link check). */
export const ISLAND_LINKS: string[] = [...new Set([...ISLANDS.flatMap((i) => i.links.map((l) => l.url)), ...Object.values(OVERSEAS_PASTEUR)])];

/** Country of an island typed as the destination ("Tenerife" → ES); territories with their own code are left to the country list. */
export function islandParentCode(text: string): string | null {
  const n = normCountry(text);
  const hit = ISLANDS.find((i) => !i.codes && i.names.some((name) => normCountry(name) === n));
  return hit ? hit.parent : null;
}
