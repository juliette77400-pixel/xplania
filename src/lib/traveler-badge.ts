// Pure logic to compute the traveler badge from the 12 score dimensions.
// Kept UI-free so it can be unit-tested and reused server-side later.

export const TRAVELER_DIMENSIONS = [
  "culture",
  "adventure",
  "nature",
  "comfort",
  "budget",
  "food",
  "authenticity",
  "social",
  "wellbeing",
  "nomad",
  "luxury",
  "organization",
] as const;

export type TravelerDimension = (typeof TRAVELER_DIMENSIONS)[number];
export type TravelerScores = Record<TravelerDimension, number>;

export type TravelerBadgeKey =
  | "cultural_explorer"
  | "digital_nomad"
  | "relaxation"
  | "adventurer"
  | "nature"
  | "gastronomic"
  | "wellbeing"
  | "social"
  | "organized"
  | "budget"
  | "curious";

export interface BadgeDefinition {
  key: TravelerBadgeKey;
  /** Feature keys mapped to routes on the result screen. */
  features: [FeatureKey, FeatureKey];
}

export type FeatureKey =
  | "discover"
  | "carnet"
  | "suivi"
  | "mood"
  | "guide-valise"
  | "guide-budget"
  | "guide-visa";

const combos: Array<{ keys: [TravelerDimension, TravelerDimension]; badge: TravelerBadgeKey }> = [
  { keys: ["culture", "authenticity"], badge: "cultural_explorer" },
  { keys: ["nomad", "organization"], badge: "digital_nomad" },
  { keys: ["comfort", "luxury"], badge: "relaxation" },
  { keys: ["adventure", "nature"], badge: "adventurer" },
  { keys: ["nature", "wellbeing"], badge: "nature" },
  { keys: ["food", "luxury"], badge: "gastronomic" },
  { keys: ["wellbeing", "comfort"], badge: "wellbeing" },
  { keys: ["social", "culture"], badge: "social" },
  { keys: ["organization", "comfort"], badge: "organized" },
];

const single: Record<TravelerDimension, TravelerBadgeKey> = {
  culture: "cultural_explorer",
  adventure: "adventurer",
  nature: "nature",
  comfort: "relaxation",
  budget: "budget",
  food: "gastronomic",
  authenticity: "cultural_explorer",
  social: "social",
  wellbeing: "wellbeing",
  nomad: "digital_nomad",
  luxury: "relaxation",
  organization: "organized",
};

export const BADGE_FEATURES: Record<TravelerBadgeKey, [FeatureKey, FeatureKey]> = {
  cultural_explorer: ["discover", "carnet"],
  digital_nomad: ["guide-budget", "suivi"],
  relaxation: ["guide-valise", "mood"],
  adventurer: ["suivi", "mood"],
  nature: ["mood", "discover"],
  gastronomic: ["discover", "carnet"],
  wellbeing: ["mood", "guide-valise"],
  social: ["mood", "carnet"],
  organized: ["guide-budget", "guide-visa"],
  budget: ["guide-budget", "guide-valise"],
  curious: ["discover", "mood"],
};

/** Rewards granted the first time a traveler profile is completed. */
export interface BadgeReward {
  points: number;
  /** i18n keys resolved on the result screen. */
  unlocks: string[];
}

export const BADGE_REWARDS: Record<TravelerBadgeKey, BadgeReward> = {
  cultural_explorer: { points: 150, unlocks: ["title", "content_culture", "ai_tone_curator"] },
  digital_nomad:     { points: 150, unlocks: ["title", "content_nomad",   "ai_tone_pragmatic"] },
  relaxation:        { points: 150, unlocks: ["title", "content_relax",   "ai_tone_soft"] },
  adventurer:        { points: 200, unlocks: ["title", "content_adventure","ai_tone_bold"] },
  nature:            { points: 150, unlocks: ["title", "content_nature",  "ai_tone_soft"] },
  gastronomic:       { points: 150, unlocks: ["title", "content_food",    "ai_tone_curator"] },
  wellbeing:         { points: 150, unlocks: ["title", "content_wellbeing","ai_tone_soft"] },
  social:            { points: 150, unlocks: ["title", "content_social",  "ai_tone_warm"] },
  organized:         { points: 150, unlocks: ["title", "content_planning","ai_tone_pragmatic"] },
  budget:            { points: 150, unlocks: ["title", "content_budget",  "ai_tone_pragmatic"] },
  curious:           { points: 100, unlocks: ["title", "ai_tone_warm"] },
};

/**
 * Returns the badge key + its two recommended features. All scores at 0 or
 * empty input falls back to "curious".
 */
export function calculateBadge(scores: TravelerScores): BadgeDefinition {
  const entries = TRAVELER_DIMENSIONS.map((d) => [d, scores[d] ?? 0] as const);
  const allZero = entries.every(([, v]) => v <= 0);
  if (allZero) return { key: "curious", features: BADGE_FEATURES.curious };

  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0]?.[0];
  const top2 = sorted[1]?.[0];

  const topKeys = new Set<TravelerDimension>([top1, top2].filter(Boolean) as TravelerDimension[]);
  const match = combos.find((c) => c.keys.every((k) => topKeys.has(k)));
  if (match) return { key: match.badge, features: BADGE_FEATURES[match.badge] };

  const key = (top1 && single[top1]) || "curious";
  return { key, features: BADGE_FEATURES[key] };
}

/** Applies a card's score_tags to a running scores object (mutation-free). */
export function applyScoreTags(
  scores: TravelerScores,
  tags: Partial<Record<string, number>>,
  direction: "right" | "left" | "skip",
): TravelerScores {
  if (direction === "skip") return scores;
  const sign = direction === "right" ? 1 : -1;
  const next = { ...scores };
  for (const [k, v] of Object.entries(tags || {})) {
    if (!v || !(k in next)) continue;
    next[k as TravelerDimension] = (next[k as TravelerDimension] ?? 0) + sign * (v as number);
  }
  return next;
}

export function emptyScores(): TravelerScores {
  return Object.fromEntries(TRAVELER_DIMENSIONS.map((d) => [d, 0])) as TravelerScores;
}

/**
 * Blends the badge's default features with the user's need_tags to produce a
 * personalized top-2 feature recommendation. A "need" only nudges the ranking
 * — the badge stays authoritative but the picks shift toward what the user
 * explicitly asked for.
 */
const NEED_TO_FEATURE_BOOST: Record<string, Partial<Record<FeatureKey, number>>> = {
  no_idea:            { discover: 3, mood: 2 },
  prepare_trip:       { carnet: 3, "guide-visa": 2, "guide-valise": 1 },
  budget_fear:        { "guide-budget": 4, "guide-valise": 1 },
  want_unusual:       { discover: 3, mood: 2 },
  travel_differently: { mood: 3, discover: 1 },
  just_curious:       { discover: 2, mood: 1 },
};

const ALL_FEATURES: FeatureKey[] = [
  "discover",
  "carnet",
  "suivi",
  "mood",
  "guide-valise",
  "guide-budget",
  "guide-visa",
];

export function recomputeRecommendedFeatures(
  badge: TravelerBadgeKey,
  needs: string[] = [],
): [FeatureKey, FeatureKey] {
  const badgeFeatures = BADGE_FEATURES[badge] ?? BADGE_FEATURES.curious;
  const scores = new Map<FeatureKey, number>();
  // Badge picks weigh most: 5 for the primary, 4 for the secondary.
  scores.set(badgeFeatures[0], 5);
  scores.set(badgeFeatures[1], (scores.get(badgeFeatures[1]) ?? 0) + 4);
  // Apply need boosts.
  for (const n of needs) {
    const boost = NEED_TO_FEATURE_BOOST[n];
    if (!boost) continue;
    for (const [feat, delta] of Object.entries(boost)) {
      const key = feat as FeatureKey;
      scores.set(key, (scores.get(key) ?? 0) + (delta ?? 0));
    }
  }
  const ranked = ALL_FEATURES
    .map((f) => [f, scores.get(f) ?? 0] as const)
    .sort((a, b) => b[1] - a[1]);
  const top1 = ranked[0][0];
  const top2 = ranked.find(([f]) => f !== top1)?.[0] ?? badgeFeatures[1];
  return [top1, top2];
}

