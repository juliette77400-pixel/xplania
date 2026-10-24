/**
 * Central feature switches.
 *
 * The beta focuses on one need: "I'm going abroad and want to organise my trip
 * ahead of time, without hassle". Only the five preparation tools stay visible.
 * Every other module keeps its code, data and translations — flip its flag back
 * to `true` to bring it back (routes, menus, shortcuts and cards follow).
 */
export const FEATURE_FLAGS = {
  // Core beta modules
  ENABLE_BUDGET_GUIDE: true,
  ENABLE_VISA_GUIDE: true,
  ENABLE_PACKING_LIST: true,
  ENABLE_CULTURAL_GUIDE: true,
  /** Housing assistant: resources, comparator, checklists (no AI, no listings). */
  ENABLE_HOUSING_ASSISTANT: true,

  // Hidden during the beta
  ENABLE_MOOD_EXPLORER: false,
  ENABLE_AI_ITINERARY: false,
  ENABLE_DISCOVER: false,
  ENABLE_TRAVEL_JOURNAL: false,
  ENABLE_GAMIFICATION: false,
  ENABLE_LIVE_TRACKING: false,
  /** Traveler DNA swipe quiz (preference profiling, not needed by the 4 tools). */
  ENABLE_TRAVELER_DNA: false,
  /** Packs on /offres (only packs whose tools are on are listed). Off: free "Bêta ESTICE" card only. */
  ENABLE_PAID_PLANS: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isEnabled = (flag: FeatureFlag): boolean => FEATURE_FLAGS[flag];

/** Where users land when they open a hidden module directly. */
export const PREPARATION_HOME = "/app";

/**
 * Path prefix → flag that owns it. Used by navigation, search and shortcuts
 * to hide links to modules that are switched off.
 */
const ROUTE_FLAGS: Array<[string, FeatureFlag]> = [
  ["/guide-budget", "ENABLE_BUDGET_GUIDE"],
  ["/guide-visa", "ENABLE_VISA_GUIDE"],
  ["/guide-valise", "ENABLE_PACKING_LIST"],
  ["/guide-culture", "ENABLE_CULTURAL_GUIDE"],
  ["/guide-logement", "ENABLE_HOUSING_ASSISTANT"],
  ["/mood", "ENABLE_MOOD_EXPLORER"],
  ["/discover", "ENABLE_DISCOVER"],
  ["/hidden-gems", "ENABLE_DISCOVER"],
  ["/destinations", "ENABLE_DISCOVER"],
  ["/liste/", "ENABLE_DISCOVER"],
  ["/explore", "ENABLE_AI_ITINERARY"],
  ["/blog/how-to-plan-a-trip-with-ai", "ENABLE_AI_ITINERARY"],
  ["/carnet", "ENABLE_TRAVEL_JOURNAL"],
  ["/suivi", "ENABLE_LIVE_TRACKING"],
  ["/gamification", "ENABLE_GAMIFICATION"],
  ["/admin/badges", "ENABLE_GAMIFICATION"],
  ["/profil-voyageur", "ENABLE_TRAVELER_DNA"],
  ["/parcours", "ENABLE_TRAVELER_DNA"],
  ["/welcome", "ENABLE_TRAVELER_DNA"],
  ["/onboarding", "ENABLE_TRAVELER_DNA"],
];

/** True when the path belongs to an enabled module (or to no module at all). */
export const isPathEnabled = (path: string): boolean => {
  const clean = path.split(/[?#]/)[0];
  for (const [prefix, flag] of ROUTE_FLAGS) {
    if (clean.startsWith(prefix)) {
      return FEATURE_FLAGS[flag];
    }
  }
  return true;
};
