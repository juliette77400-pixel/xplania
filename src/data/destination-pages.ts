// Public SEO guides "Préparer son Erasmus ou son stage en/au…": one page per
// country that has a hand-written culture sheet. Every link below was opened
// and checked on LINKS_CHECKED_ON — nothing here is AI-generated.
export const LINKS_CHECKED_ON = "2026-10-24";

export interface DestinationPage {
  code: string;
  slug: string;
  /** Country name with its preposition, e.g. "en Espagne" / "in Spain". */
  inFr: string;
  inEn: string;
  nameFr: string;
  nameEn: string;
  /** Slug used by France Diplomatie and Institut Pasteur pages. */
  officialSlug: string;
}

export const DESTINATION_PAGES: DestinationPage[] = [
  { code: "ES", slug: "espagne", nameFr: "Espagne", nameEn: "Spain", inFr: "en Espagne", inEn: "in Spain", officialSlug: "espagne" },
  { code: "GB", slug: "royaume-uni", nameFr: "Royaume-Uni", nameEn: "United Kingdom", inFr: "au Royaume-Uni", inEn: "in the UK", officialSlug: "royaume-uni" },
  { code: "NL", slug: "pays-bas", nameFr: "Pays-Bas", nameEn: "Netherlands", inFr: "aux Pays-Bas", inEn: "in the Netherlands", officialSlug: "pays-bas" },
  { code: "PL", slug: "pologne", nameFr: "Pologne", nameEn: "Poland", inFr: "en Pologne", inEn: "in Poland", officialSlug: "pologne" },
  { code: "US", slug: "etats-unis", nameFr: "États-Unis", nameEn: "United States", inFr: "aux États-Unis", inEn: "in the United States", officialSlug: "etats-unis" },
  { code: "AU", slug: "australie", nameFr: "Australie", nameEn: "Australia", inFr: "en Australie", inEn: "in Australia", officialSlug: "australie" },
  { code: "JP", slug: "japon", nameFr: "Japon", nameEn: "Japan", inFr: "au Japon", inEn: "in Japan", officialSlug: "japon" },
  { code: "CN", slug: "chine", nameFr: "Chine", nameEn: "China", inFr: "en Chine", inEn: "in China", officialSlug: "chine" },
  { code: "MX", slug: "mexique", nameFr: "Mexique", nameEn: "Mexico", inFr: "au Mexique", inEn: "in Mexico", officialSlug: "mexique" },
  { code: "BR", slug: "bresil", nameFr: "Brésil", nameEn: "Brazil", inFr: "au Brésil", inEn: "in Brazil", officialSlug: "bresil" },
];

export const DESTINATIONS_HUB = "/preparer";
export const destinationPath = (d: DestinationPage) => `${DESTINATIONS_HUB}/${d.slug}`;
export const findDestination = (slug: string | undefined) => DESTINATION_PAGES.find((d) => d.slug === slug) ?? null;

export const franceDiplomatieEntryUrl = (d: DestinationPage) =>
  `https://www.diplomatie.gouv.fr/fr/information-par-pays/${d.officialSlug}/conseils-aux-voyageurs-entree-sejour`;
export const pasteurUrl = (d: DestinationPage) =>
  `https://www.pasteur.fr/fr/votre-sante/voyages-et-sante/recommandations-sanitaires-par-pays/${d.officialSlug}`;
