/**
 * Destination cost-of-living multipliers for budget AI suggestions.
 * Values are relative to a baseline of 1.0 (≈ Paris / Western Europe).
 * Per category: accommodation, localTransport, activities, food, shopping, extras, unexpected.
 */
export type CategoryKey =
  | "accommodation"
  | "localTransport"
  | "activities"
  | "food"
  | "shopping"
  | "extras"
  | "unexpected";

interface CityProfile {
  match: RegExp;
  /** Average meal cost in EUR — used for realistic per-meal numbers */
  mealCost: number;
  /** Average transit day pass in EUR */
  transitDay: number;
  /** Average mid-range hotel night in EUR */
  hotelNight: number;
  /** Per-category multipliers vs baseline */
  mult: Record<CategoryKey, number>;
  /** Currency hint */
  currency: string;
}

const PROFILES: CityProfile[] = [
  {
    match: /paris|france/i,
    mealCost: 22,
    transitDay: 8,
    hotelNight: 130,
    mult: { accommodation: 1.3, localTransport: 1.0, activities: 1.1, food: 1.15, shopping: 1.2, extras: 1.1, unexpected: 1.1 },
    currency: "EUR",
  },
  {
    match: /london|londres/i,
    mealCost: 28,
    transitDay: 9,
    hotelNight: 160,
    mult: { accommodation: 1.6, localTransport: 1.4, activities: 1.3, food: 1.4, shopping: 1.3, extras: 1.2, unexpected: 1.2 },
    currency: "GBP",
  },
  {
    match: /tokyo|japan|japon|kyoto|osaka/i,
    mealCost: 14,
    transitDay: 7,
    hotelNight: 110,
    mult: { accommodation: 1.1, localTransport: 0.9, activities: 1.0, food: 0.8, shopping: 1.1, extras: 1.0, unexpected: 1.0 },
    currency: "JPY",
  },
  {
    match: /hanoi|vietnam|ho chi minh|saigon/i,
    mealCost: 4,
    transitDay: 2,
    hotelNight: 28,
    mult: { accommodation: 0.3, localTransport: 0.25, activities: 0.4, food: 0.25, shopping: 0.5, extras: 0.4, unexpected: 0.5 },
    currency: "VND",
  },
  {
    match: /bangkok|tha[iï]lande|thailand|phuket|chiang mai/i,
    mealCost: 5,
    transitDay: 3,
    hotelNight: 38,
    mult: { accommodation: 0.4, localTransport: 0.3, activities: 0.5, food: 0.3, shopping: 0.55, extras: 0.45, unexpected: 0.6 },
    currency: "THB",
  },
  {
    match: /bali|indonesia|indon[eé]sie|jakarta/i,
    mealCost: 4,
    transitDay: 4,
    hotelNight: 32,
    mult: { accommodation: 0.35, localTransport: 0.3, activities: 0.45, food: 0.3, shopping: 0.5, extras: 0.4, unexpected: 0.5 },
    currency: "IDR",
  },
  {
    match: /new york|nyc|usa|united states|los angeles|san francisco/i,
    mealCost: 26,
    transitDay: 8,
    hotelNight: 180,
    mult: { accommodation: 1.8, localTransport: 1.2, activities: 1.4, food: 1.5, shopping: 1.4, extras: 1.3, unexpected: 1.3 },
    currency: "USD",
  },
  {
    match: /lisbon|lisbonne|portugal|porto/i,
    mealCost: 12,
    transitDay: 6,
    hotelNight: 75,
    mult: { accommodation: 0.75, localTransport: 0.7, activities: 0.8, food: 0.7, shopping: 0.85, extras: 0.8, unexpected: 0.85 },
    currency: "EUR",
  },
  {
    match: /rome|italie|italy|milan|florence|venice|venise/i,
    mealCost: 18,
    transitDay: 7,
    hotelNight: 95,
    mult: { accommodation: 1.0, localTransport: 0.85, activities: 1.0, food: 0.9, shopping: 1.0, extras: 0.95, unexpected: 1.0 },
    currency: "EUR",
  },
  {
    match: /barcelone|barcelona|madrid|spain|espagne|seville/i,
    mealCost: 15,
    transitDay: 6,
    hotelNight: 85,
    mult: { accommodation: 0.9, localTransport: 0.8, activities: 0.85, food: 0.8, shopping: 0.9, extras: 0.85, unexpected: 0.95 },
    currency: "EUR",
  },
  {
    match: /maroc|morocco|marrakech|fes|casablanca/i,
    mealCost: 6,
    transitDay: 3,
    hotelNight: 45,
    mult: { accommodation: 0.5, localTransport: 0.35, activities: 0.55, food: 0.4, shopping: 0.6, extras: 0.5, unexpected: 0.6 },
    currency: "MAD",
  },
];

const DEFAULT_PROFILE: CityProfile = {
  match: /./,
  mealCost: 18,
  transitDay: 6,
  hotelNight: 90,
  mult: { accommodation: 1.0, localTransport: 1.0, activities: 1.0, food: 1.0, shopping: 1.0, extras: 1.0, unexpected: 1.0 },
  currency: "EUR",
};

export const getCityProfile = (destination: string): CityProfile => {
  return PROFILES.find((p) => p.match.test(destination)) ?? DEFAULT_PROFILE;
};

/**
 * Compute realistic AI-suggested amount per category for a given destination,
 * trip duration, traveler count and style.
 *
 * Returns an integer EUR amount that is intentionally NOT rounded to obvious
 * defaults (50/100). Adds a small deterministic variation per category so
 * suggestions don't all look identical.
 */
export const suggestCategoryAmount = (
  category: CategoryKey,
  currentPlanned: number,
  opts: {
    destination: string;
    days: number;
    travelers?: number;
    seasonMultiplier?: number; // 0.85 low / 1.0 mid / 1.15 peak
  }
): number => {
  const profile = getCityProfile(opts.destination);
  const travelers = Math.max(1, opts.travelers ?? 1);
  const season = opts.seasonMultiplier ?? 1.0;

  // Baseline from real cost anchors
  let baseline = 0;
  switch (category) {
    case "accommodation":
      baseline = profile.hotelNight * Math.max(1, opts.days) * 0.9;
      break;
    case "localTransport":
      baseline = profile.transitDay * Math.max(1, opts.days) * travelers;
      break;
    case "food":
      baseline = profile.mealCost * 2 * Math.max(1, opts.days) * travelers;
      break;
    case "activities":
      baseline = (profile.mealCost * 1.6) * Math.max(1, opts.days) * travelers;
      break;
    case "shopping":
      baseline = profile.mealCost * 2.5 * travelers;
      break;
    case "extras":
      baseline = profile.mealCost * 1.5 * travelers;
      break;
    case "unexpected":
      baseline = (currentPlanned || profile.mealCost * 3) * 0.15;
      break;
  }
  const multiplied = baseline * profile.mult[category] * season;

  // Blend with current planned (so user history matters) — weight 30% baseline / 70% planned
  // but if planned is 0, use full baseline.
  const blended = currentPlanned > 0 ? multiplied * 0.55 + currentPlanned * 0.45 : multiplied;

  // Deterministic non-trivial variation based on destination + category hash
  const hash = (opts.destination + category).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((hash % 17) - 8) / 100; // -8% .. +8%
  const final = blended * (1 + jitter);

  // Avoid suspiciously round numbers — never end in 0 or 5 when possible
  let n = Math.max(1, Math.round(final));
  if (n % 10 === 0 || n % 5 === 0) {
    n = n + ((hash % 7) - 3); // +/-3
    if (n < 1) n = 1;
  }
  return n;
};

export const buildAdjustmentExplanation = (
  category: CategoryKey,
  destination: string,
  days: number,
  month: string,
  locale: "fr" | "en"
): string => {
  const profile = getCityProfile(destination);
  if (locale === "en") {
    switch (category) {
      case "accommodation":
        return `Based on mid-range stays in ${destination} (~€${profile.hotelNight}/night) across ${days} day${days > 1 ? "s" : ""}.`;
      case "localTransport":
        return `Local transit in ${destination} averages ~€${profile.transitDay}/day in ${month}.`;
      case "food":
        return `Average meal in ${destination} is ~€${profile.mealCost} — sized for ${days} day${days > 1 ? "s" : ""}.`;
      case "activities":
        return `Adjusted to typical activity prices in ${destination} (${month}).`;
      default:
        return `Adjusted to average ${destination} prices in ${month}.`;
    }
  }
  switch (category) {
    case "accommodation":
      return `Basé sur des hébergements milieu de gamme à ${destination} (~${profile.hotelNight} €/nuit) sur ${days} jour${days > 1 ? "s" : ""}.`;
    case "localTransport":
      return `Les transports locaux à ${destination} coûtent ~${profile.transitDay} €/jour en ${month}.`;
    case "food":
      return `Le repas moyen à ${destination} tourne autour de ${profile.mealCost} € — calibré pour ${days} jour${days > 1 ? "s" : ""}.`;
    case "activities":
      return `Ajusté aux tarifs habituels d'activités à ${destination} (${month}).`;
    default:
      return `Ajusté aux prix moyens à ${destination} en ${month}.`;
  }
};
