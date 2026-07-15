// -----------------------------------------------------------------------------
// Freemium feature-unlock config
// -----------------------------------------------------------------------------
// Single source of truth for:
//   1. Which app feature is unlocked "for free" based on a traveler's dominant
//      score (Mood Explorer is ALWAYS free — see FREE_ANCHOR).
//   2. Which paid pack from the /offres pricing page is highlighted for that
//      same dominant score (so the premium dialog can push the most relevant
//      pack first).
//
// This config is intentionally isolated from any UI or business logic so it
// can be tweaked by product/marketing without touching component code, and
// so the same mapping can later be reused server-side by the recommendation
// engine (Mémoire Xplania / RAG).
// -----------------------------------------------------------------------------
import type { FeatureKey, TravelerDimension, TravelerScores } from "./traveler-badge";

/** Full app catalogue displayed on the result screen. Order = display order. */
export const ALL_APP_FEATURES: FeatureKey[] = [
  "mood",
  "discover",
  "carnet",
  "suivi",
  "guide-valise",
  "guide-budget",
  "guide-visa",
];

/** Feature that is ALWAYS included in the two free unlocks (core UX). */
export const FREE_ANCHOR: FeatureKey = "mood";

/**
 * Dominant score → dynamic 2nd free feature.
 * Editable single source of truth for product/marketing tuning.
 */
export const SCORE_TO_FREE_FEATURE: Record<TravelerDimension, FeatureKey> = {
  culture:      "carnet",        // curator instinct → journaling
  authenticity: "discover",      // wants the local, off-piste angle
  adventure:    "suivi",         // live trip tracker + challenges
  nature:       "discover",      // hidden gems / nature spots
  food:         "discover",      // local food discovery
  social:       "carnet",        // shareable journal
  comfort:      "guide-valise",  // packing simplifies comfort travel
  luxury:       "guide-valise",  // premium packing / outfit tips
  wellbeing:    "guide-valise",  // wellbeing checklist
  nomad:        "guide-budget",  // budget / long stays
  budget:       "guide-budget",  // obvious fit
  organization: "guide-visa",    // formalities & planning
};

/**
 * Dominant score → pack from /offres to highlight in the premium dialog.
 * Pack IDs must match those declared in `src/pages/Offres.tsx`.
 */
export type PremiumPackId = "admin" | "creatif" | "ia" | "intercultural" | "futur" | "all";

export const SCORE_TO_PACK: Record<TravelerDimension, PremiumPackId> = {
  culture:      "intercultural",
  authenticity: "intercultural",
  adventure:    "ia",
  nature:       "ia",
  food:         "creatif",
  social:       "creatif",
  comfort:      "admin",
  luxury:       "all",
  wellbeing:    "creatif",
  nomad:        "admin",
  budget:       "admin",
  organization: "admin",
};

/** Human labels for the "why we picked this" banner. */
export const SCORE_LABEL_FR: Record<TravelerDimension, string> = {
  culture:      "ta curiosité culturelle",
  authenticity: "ton goût pour l'authentique",
  adventure:    "ton âme d'aventurier·e",
  nature:       "ton amour de la nature",
  food:         "ta passion food",
  social:       "ton côté social",
  comfort:      "ta recherche de confort",
  luxury:       "ton goût du raffiné",
  wellbeing:    "ta quête de bien-être",
  nomad:        "ton mode nomade",
  budget:       "ta maîtrise du budget",
  organization: "ton besoin d'organisation",
};

/** Sort scores desc and return the dominant non-zero dimension (or null). */
export function dominantDimension(scores: Partial<TravelerScores>): TravelerDimension | null {
  const entries = Object.entries(scores) as [TravelerDimension, number][];
  const positive = entries.filter(([, v]) => (v ?? 0) > 0);
  if (positive.length === 0) return null;
  positive.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return positive[0][0];
}

/** Top N dimensions with score > 0, sorted desc. */
export function topDimensions(scores: Partial<TravelerScores>, n = 4): TravelerDimension[] {
  const entries = Object.entries(scores) as [TravelerDimension, number][];
  return entries
    .filter(([, v]) => (v ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, n)
    .map(([k]) => k);
}

/**
 * Derive the two free features: Mood Explorer always, plus the feature mapped
 * to the dominant dimension (or `discover` as a graceful fallback if the
 * dominant is null or already maps to Mood).
 */
export function deriveFreeFeatures(
  scores: Partial<TravelerScores>,
): [FeatureKey, FeatureKey] {
  const dom = dominantDimension(scores);
  const secondaryCandidate = dom ? SCORE_TO_FREE_FEATURE[dom] : "discover";
  const secondary: FeatureKey = secondaryCandidate === FREE_ANCHOR ? "discover" : secondaryCandidate;
  return [FREE_ANCHOR, secondary];
}

/** Derive the paid pack most relevant to this profile (for the premium modal). */
export function derivePremiumPack(scores: Partial<TravelerScores>): PremiumPackId {
  const dom = dominantDimension(scores);
  return dom ? SCORE_TO_PACK[dom] : "all";
}
