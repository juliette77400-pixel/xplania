// French prepositions and articles in front of a place name:
// « en Espagne », « au Japon », « aux États-Unis », « à Madrid », « à Cuba », « à La Réunion »,
// « de l'Espagne », « du Japon », « pour la Corée du Sud »… Countries come from the French country
// list; anything else (a city, "Gran Canaria, Espagne") is treated as a city.
import { countryList } from "@/lib/countries";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const COUNTRY_NAMES = new Set(countryList.map((c) => norm(c.name)));
// Islands and small states used without article (« à Cuba », « de Malte »).
const NO_ARTICLE = new Set([
  "cuba", "madagascar", "malte", "chypre", "singapour", "maurice", "taiwan", "bahrein", "haiti", "hong kong", "macao", "monaco",
  "tahiti", "bali", "mayotte", "brunei", "saint-marin", "sainte-lucie", "saint-martin (partie francaise)", "saint-martin",
  "saint-barthelemy", "saint-pierre-et-miquelon", "wallis-et-futuna", "trinite-et-tobago", "nauru", "tuvalu", "kiribati", "oman",
  "jersey", "guernesey", "porto rico",
]);
// « en Israël » but « d'Israël ».
const EN_NO_ARTICLE = new Set(["israel"]);
// Countries ending in -e that are masculine.
const MASC_E = new Set(["mexique", "cambodge", "mozambique", "zimbabwe", "belize", "suriname"]);
const DISPLAY: Record<string, string> = { reunion: "La Réunion", "etats-unis d'amerique": "États-Unis", "emirats arabes unis": "Émirats arabes unis" };

type Kind = "city" | "bare" | "enBare" | "fem" | "masc" | "plural";

const startsWithVowel = (s: string) => /^[aeiouy]/.test(norm(s));

function classify(raw: string): { name: string; kind: Kind } {
  const n = norm(raw);
  if (n === "reunion" || n === "la reunion") return { name: "La Réunion", kind: "bare" };
  const name = DISPLAY[n] ?? raw.trim();
  if (!COUNTRY_NAMES.has(n) && !NO_ARTICLE.has(n)) return { name, kind: "city" };
  if (NO_ARTICLE.has(n)) return { name, kind: "bare" };
  if (EN_NO_ARTICLE.has(n)) return { name, kind: "enBare" };
  const head = n.split(/[\s-]/)[0];
  if (/^(etats|pays-bas|iles |emirats|philippines|maldives|seychelles|comores|bahamas|fidji|antilles)/.test(n)) {
    return { name, kind: "plural" };
  }
  if (head.endsWith("e") && !MASC_E.has(n) && !MASC_E.has(head)) return { name, kind: "fem" };
  return { name, kind: "masc" };
}

/** Text before a comma is the most precise place (« Gran Canaria, Espagne » → Gran Canaria). */
const placeOf = (value: string) => {
  const v = (value || "").trim();
  return v.includes(",") ? v.split(",")[0].trim() : v;
};

/** « l'Espagne », « le Japon », « les États-Unis », « Madrid ». */
export function frArticle(value: string): string {
  const { name, kind } = classify(placeOf(value));
  if (!name) return "";
  switch (kind) {
    case "plural": return `les ${name}`;
    case "fem": return startsWithVowel(name) ? `l'${name}` : `la ${name}`;
    case "masc": return startsWithVowel(name) ? `l'${name}` : `le ${name}`;
    default: return name;
  }
}

/** « en Espagne », « au Japon », « aux États-Unis », « à Madrid ». */
export function frIn(value: string): string {
  const { name, kind } = classify(placeOf(value));
  if (!name) return "";
  switch (kind) {
    case "plural": return `aux ${name}`;
    case "fem": case "enBare": return `en ${name}`;
    case "masc": return startsWithVowel(name) ? `en ${name}` : `au ${name}`;
    default: return `à ${name}`;
  }
}

/** « à l'Espagne », « au Japon », « aux États-Unis », « à Madrid ». */
export function frTo(value: string): string {
  const a = frArticle(value);
  if (a.startsWith("le ")) return `au ${a.slice(3)}`;
  if (a.startsWith("les ")) return `aux ${a.slice(4)}`;
  return `à ${a}`;
}

/** « de l'Espagne », « du Japon », « des États-Unis », « de Madrid », « d'Amsterdam ». */
export function frOf(value: string): string {
  const a = frArticle(value);
  if (!a) return "";
  if (a.startsWith("le ")) return `du ${a.slice(3)}`;
  if (a.startsWith("les ")) return `des ${a.slice(4)}`;
  if (a.startsWith("la ") || a.startsWith("l'")) return `de ${a}`;
  return startsWithVowel(a) ? `d'${a}` : `de ${a}`;
}

/** « pour l'Espagne », « pour le Japon », « pour Madrid ». */
export const frFor = (value: string) => {
  const a = frArticle(value);
  return a ? `pour ${a}` : "";
};
