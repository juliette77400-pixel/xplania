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
  // Added 28 Oct 2026 — France Diplomatie and Institut Pasteur pages opened (HTTP 200).
  { code: "ID", slug: "indonesie", nameFr: "Indonésie", nameEn: "Indonesia", inFr: "en Indonésie", inEn: "in Indonesia", officialSlug: "indonesie" },
  { code: "KR", slug: "coree-du-sud", nameFr: "Corée du Sud", nameEn: "South Korea", inFr: "en Corée du Sud", inEn: "in South Korea", officialSlug: "coree-du-sud" },
  { code: "NZ", slug: "nouvelle-zelande", nameFr: "Nouvelle-Zélande", nameEn: "New Zealand", inFr: "en Nouvelle-Zélande", inEn: "in New Zealand", officialSlug: "nouvelle-zelande" },
  { code: "PT", slug: "portugal", nameFr: "Portugal", nameEn: "Portugal", inFr: "au Portugal", inEn: "in Portugal", officialSlug: "portugal" },
  { code: "CL", slug: "chili", nameFr: "Chili", nameEn: "Chile", inFr: "au Chili", inEn: "in Chile", officialSlug: "chili" },
  { code: "AR", slug: "argentine", nameFr: "Argentine", nameEn: "Argentina", inFr: "en Argentine", inEn: "in Argentina", officialSlug: "argentine" },
  { code: "DK", slug: "danemark", nameFr: "Danemark", nameEn: "Denmark", inFr: "au Danemark", inEn: "in Denmark", officialSlug: "danemark" },
  { code: "SE", slug: "suede", nameFr: "Suède", nameEn: "Sweden", inFr: "en Suède", inEn: "in Sweden", officialSlug: "suede" },
  { code: "IT", slug: "italie", nameFr: "Italie", nameEn: "Italy", inFr: "en Italie", inEn: "in Italy", officialSlug: "italie" },
  { code: "HU", slug: "hongrie", nameFr: "Hongrie", nameEn: "Hungary", inFr: "en Hongrie", inEn: "in Hungary", officialSlug: "hongrie" },
  { code: "CH", slug: "suisse", nameFr: "Suisse", nameEn: "Switzerland", inFr: "en Suisse", inEn: "in Switzerland", officialSlug: "suisse" },
  { code: "NO", slug: "norvege", nameFr: "Norvège", nameEn: "Norway", inFr: "en Norvège", inEn: "in Norway", officialSlug: "norvege" },
  { code: "GR", slug: "grece", nameFr: "Grèce", nameEn: "Greece", inFr: "en Grèce", inEn: "in Greece", officialSlug: "grece" },
  { code: "ZA", slug: "afrique-du-sud", nameFr: "Afrique du Sud", nameEn: "South Africa", inFr: "en Afrique du Sud", inEn: "in South Africa", officialSlug: "afrique-du-sud" },
  { code: "AT", slug: "autriche", nameFr: "Autriche", nameEn: "Austria", inFr: "en Autriche", inEn: "in Austria", officialSlug: "autriche" },
  { code: "BG", slug: "bulgarie", nameFr: "Bulgarie", nameEn: "Bulgaria", inFr: "en Bulgarie", inEn: "in Bulgaria", officialSlug: "bulgarie" },
  { code: "IE", slug: "irlande", nameFr: "Irlande", nameEn: "Ireland", inFr: "en Irlande", inEn: "in Ireland", officialSlug: "irlande" },
  { code: "PE", slug: "perou", nameFr: "Pérou", nameEn: "Peru", inFr: "au Pérou", inEn: "in Peru", officialSlug: "perou" },
  { code: "IN", slug: "inde", nameFr: "Inde", nameEn: "India", inFr: "en Inde", inEn: "in India", officialSlug: "inde" },
];

export const DESTINATIONS_HUB = "/preparer";
export const destinationPath = (d: DestinationPage) => `${DESTINATIONS_HUB}/${d.slug}`;
export const findDestination = (slug: string | undefined) => DESTINATION_PAGES.find((d) => d.slug === slug) ?? null;

export const franceDiplomatieEntryUrl = (d: DestinationPage) =>
  `https://www.diplomatie.gouv.fr/fr/information-par-pays/${d.officialSlug}/conseils-aux-voyageurs-entree-sejour`;
export const pasteurUrl = (d: DestinationPage) =>
  `https://www.pasteur.fr/fr/votre-sante/voyages-et-sante/recommandations-sanitaires-par-pays/${d.officialSlug}`;
