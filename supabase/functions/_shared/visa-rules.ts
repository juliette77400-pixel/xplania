// Fixed free-movement rule. Mirrors src/lib/visa-rules.ts (kept in sync by hand
// because edge functions cannot import from src/).
// EU + EEA (Iceland, Liechtenstein, Norway) + Switzerland.
export const FREE_MOVEMENT = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "CH",
]);

/** True when one of the traveller's nationalities gives free movement to the destination. */
export function hasFreeMovement(destination: string, nationalities: Array<string | null | undefined>): boolean {
  const d = (destination || "").toUpperCase();
  if (!FREE_MOVEMENT.has(d)) return false;
  return nationalities.some((n) => !!n && FREE_MOVEMENT.has(n.toUpperCase()));
}

export const EU_SOURCE_URL = "https://europa.eu/youreurope/citizens/travel/entry-exit/eu-citizen/index_fr.htm";
export const EU_SOURCE_URL_EN = "https://europa.eu/youreurope/citizens/travel/entry-exit/eu-citizen/index_en.htm";
