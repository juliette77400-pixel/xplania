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
  | "unexpected"
  | "flights"
  | "insurance"
  | "connectivity"
  | "fees"
  | "deposit"
  | "setup"
  | "returnFees";

interface CityProfile {
  match: RegExp;
  /** Average meal cost in EUR — used for realistic per-meal numbers */
  mealCost: number;
  /** Average transit day pass in EUR */
  transitDay: number;
  /** Average mid-range hotel night in EUR */
  hotelNight: number;
  /** Per-category multipliers vs baseline */
  mult: Partial<Record<CategoryKey, number>>;
  /** Currency hint */
  currency: string;
  /** Typical round-trip flight from France in EUR, when known (else guessed from hotel prices). */
  flight?: number;
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
    match: /lisbon|lisbonne|portugal|porto(?! alegre)/i,
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
  // Added 28 Oct 2026 — rough student orders of magnitude (EUR) from public cost-of-living
  // comparisons, to be refreshed; rent ≈ hotelNight × 6 × accommodation, food ≈ mealCost × 20 × food.
  {
    match: /cor[eé]e|korea|s[eé]oul|busan|pusan|daejeon|incheon/i,
    mealCost: 9,
    transitDay: 4,
    hotelNight: 85,
    flight: 850,
    mult: { accommodation: 0.98, localTransport: 0.85, activities: 0.85, food: 1.67, shopping: 0.85, extras: 0.85, unexpected: 0.85 },
    currency: "KRW",
  },
  {
    match: /nouvelle[- ]z[eé]lande|new zealand|auckland|wellington|christchurch|dunedin/i,
    mealCost: 18,
    transitDay: 9,
    hotelNight: 120,
    flight: 1500,
    mult: { accommodation: 1.04, localTransport: 1.0, activities: 1.0, food: 1.0, shopping: 1.0, extras: 1.0, unexpected: 1.0 },
    currency: "NZD",
  },
  {
    match: /\bchili\b|\bchile\b|santiago|valpara[ií]so|concepci[oó]n/i,
    mealCost: 9,
    transitDay: 3,
    hotelNight: 65,
    flight: 1050,
    mult: { accommodation: 1.03, localTransport: 0.65, activities: 0.65, food: 1.39, shopping: 0.65, extras: 0.65, unexpected: 0.65 },
    currency: "CLP",
  },
  {
    match: /argentin|buenos aires|c[oó]rdoba|rosario|mendoza/i,
    mealCost: 8,
    transitDay: 2,
    hotelNight: 55,
    flight: 1050,
    mult: { accommodation: 1.06, localTransport: 0.55, activities: 0.55, food: 1.38, shopping: 0.55, extras: 0.55, unexpected: 0.55 },
    currency: "ARS",
  },
  {
    match: /danemark|denmark|copenhag|k[øo]benhavn|aarhus|odense|aalborg/i,
    mealCost: 20,
    transitDay: 10,
    hotelNight: 140,
    flight: 250,
    mult: { accommodation: 0.95, localTransport: 1.25, activities: 1.25, food: 0.95, shopping: 1.25, extras: 1.25, unexpected: 1.25 },
    currency: "DKK",
  },
  {
    match: /su[eè]de|sweden|stockholm|g[oö]teborg|gothenburg|uppsala|lund|malm[oö]/i,
    mealCost: 13,
    transitDay: 9,
    hotelNight: 120,
    flight: 250,
    mult: { accommodation: 0.83, localTransport: 1.05, activities: 1.05, food: 1.27, shopping: 1.05, extras: 1.05, unexpected: 1.05 },
    currency: "SEK",
  },
  {
    match: /hongrie|hungary|budapest|debrecen|szeged|p[eé]cs/i,
    mealCost: 9,
    transitDay: 4,
    hotelNight: 70,
    flight: 200,
    mult: { accommodation: 1.07, localTransport: 0.6, activities: 0.6, food: 1.28, shopping: 0.6, extras: 0.6, unexpected: 0.6 },
    currency: "HUF",
  },
  {
    match: /suisse|switzerland|schweiz|gen[eè]ve|geneva|zurich|z[uü]rich|lausanne|\bberne?\b|b[aâ]le|basel|lucerne|luzern/i,
    mealCost: 28,
    transitDay: 12,
    hotelNight: 180,
    flight: 200,
    mult: { accommodation: 0.93, localTransport: 1.5, activities: 1.5, food: 0.89, shopping: 1.5, extras: 1.5, unexpected: 1.5 },
    currency: "CHF",
  },
  {
    match: /norv[eè]ge|norway|oslo|bergen|trondheim|stavanger|troms[oø]/i,
    mealCost: 22,
    transitDay: 11,
    hotelNight: 150,
    flight: 300,
    mult: { accommodation: 0.89, localTransport: 1.35, activities: 1.35, food: 1.02, shopping: 1.35, extras: 1.35, unexpected: 1.35 },
    currency: "NOK",
  },
  {
    match: /gr[eè]ce|greece|ath[eè]nes|athens|thessalonique|thessaloniki|patras|h[eé]raklion|heraklion/i,
    mealCost: 13,
    transitDay: 5,
    hotelNight: 80,
    flight: 250,
    mult: { accommodation: 0.83, localTransport: 0.75, activities: 0.75, food: 1.0, shopping: 0.75, extras: 0.75, unexpected: 0.75 },
    currency: "EUR",
  },
  {
    match: /afrique du sud|south africa|le cap|cape town|johannesburg|durban|pretoria|stellenbosch/i,
    mealCost: 9,
    transitDay: 4,
    hotelNight: 70,
    flight: 900,
    mult: { accommodation: 0.95, localTransport: 0.55, activities: 0.55, food: 1.22, shopping: 0.55, extras: 0.55, unexpected: 0.55 },
    currency: "ZAR",
  },
  {
    match: /autriche|austria|\bvienne\b|vienna|\bwien\b|graz|salzbourg|salzburg|innsbruck|linz/i,
    mealCost: 15,
    transitDay: 6,
    hotelNight: 100,
    flight: 200,
    mult: { accommodation: 0.92, localTransport: 0.95, activities: 0.95, food: 1.07, shopping: 0.95, extras: 0.95, unexpected: 0.95 },
    currency: "EUR",
  },
  {
    match: /bulgarie|bulgaria|sofia|plovdiv|varna/i,
    mealCost: 8,
    transitDay: 2,
    hotelNight: 55,
    flight: 250,
    mult: { accommodation: 1.06, localTransport: 0.5, activities: 0.5, food: 1.25, shopping: 0.5, extras: 0.5, unexpected: 0.5 },
    currency: "EUR",
  },
  {
    match: /irlande|ireland|dublin|\bcork\b|galway|limerick/i,
    mealCost: 18,
    transitDay: 8,
    hotelNight: 150,
    flight: 200,
    mult: { accommodation: 1.0, localTransport: 1.15, activities: 1.15, food: 1.0, shopping: 1.15, extras: 1.15, unexpected: 1.15 },
    currency: "EUR",
  },
  {
    match: /p[eé]rou|\bperu\b|\blima\b|cusco|cuzco|arequipa/i,
    mealCost: 5,
    transitDay: 2,
    hotelNight: 50,
    flight: 1000,
    mult: { accommodation: 1.0, localTransport: 0.45, activities: 0.45, food: 1.8, shopping: 0.45, extras: 0.45, unexpected: 0.45 },
    currency: "PEN",
  },
  {
    match: /\binde\b|\bindia\b|new delhi|delhi|mumbai|bombay|bangalore|bengaluru|pondich[eé]ry|chennai|pune|hyderabad|kolkata/i,
    mealCost: 3,
    transitDay: 2,
    hotelNight: 40,
    flight: 650,
    mult: { accommodation: 0.83, localTransport: 0.35, activities: 0.35, food: 2.0, shopping: 0.35, extras: 0.35, unexpected: 0.35 },
    currency: "INR",
  },
  {
    match: /mexi|guadalajara|oaxaca|monterrey|canc[uú]n/i,
    mealCost: 7,
    transitDay: 2,
    hotelNight: 60,
    flight: 750,
    mult: { accommodation: 0.97, localTransport: 0.5, activities: 0.5, food: 1.43, shopping: 0.5, extras: 0.5, unexpected: 0.5 },
    currency: "MXN",
  },
  {
    match: /br[eé]sil|brazil|rio de janeiro|s[aã]o paulo|salvador|florian[oó]polis|belo horizonte|porto alegre|recife/i,
    mealCost: 7,
    transitDay: 2,
    hotelNight: 60,
    flight: 800,
    mult: { accommodation: 0.97, localTransport: 0.5, activities: 0.5, food: 1.57, shopping: 0.5, extras: 0.5, unexpected: 0.5 },
    currency: "BRL",
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
  const days = Math.max(1, opts.days);
  // Student stays of a month or more: monthly rent, groceries and passes instead of
  // hotel nights and restaurant meals. Rough anchors derived from the city profile.
  if (days >= 28) {
    const months = days / 30.44;
    const rent = profile.hotelNight * 6;
    const food = profile.mealCost * 20;
    switch (category) {
      case "accommodation": baseline = rent * months; break;
      case "food": baseline = food * months * travelers; break;
      case "localTransport": baseline = profile.transitDay * 8 * months * travelers; break;
      case "activities": baseline = profile.mealCost * 5 * months * travelers; break;
      case "shopping": baseline = profile.mealCost * 2.5 * months * travelers; break;
      case "extras": baseline = profile.mealCost * 2 * months * travelers; break;
      case "unexpected": baseline = (rent + food) * months * 0.05; break;
      case "flights": baseline = (profile.flight ?? (profile.hotelNight < 60 ? 650 : profile.hotelNight > 150 ? 550 : 220)) * travelers; break;
      case "insurance": baseline = days * 1.3 * travelers; break;
      case "connectivity": baseline = 15 * months; break;
      case "fees": baseline = profile.mealCost * 0.5 * months * travelers; break;
      // Housing deposit ≈ one month of rent (often refundable), moving-in kit, end-of-stay costs.
      case "deposit": baseline = rent; break;
      case "setup": baseline = profile.mealCost * 10; break;
      case "returnFees": baseline = profile.mealCost * 4; break;
    }
    const mult = category === "deposit" ? profile.mult.accommodation ?? 1
      : ["flights", "insurance", "unexpected", "setup", "returnFees"].includes(category) ? 1 : profile.mult[category] ?? 1;
    const est = baseline * mult * season;
    const blendedLong = currentPlanned > 0 ? est * 0.55 + currentPlanned * 0.45 : est;
    return Math.max(10, Math.round(blendedLong / 10) * 10);
  }
  // Short trips: no deposit, moving-in or end-of-stay costs.
  if (category === "deposit" || category === "setup" || category === "returnFees") return 0;
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
    case "flights":
      // Round-trip transport: long-haul destinations (cheap local costs) tend to be far away.
      baseline = (profile.flight ?? (profile.hotelNight < 60 ? 650 : profile.hotelNight > 150 ? 550 : 220)) * travelers;
      break;
    case "insurance":
      baseline = (18 + Math.max(1, opts.days) * 2.2) * travelers;
      break;
    case "connectivity":
      baseline = (profile.mult.accommodation ?? 1) < 0.6 ? 12 : Math.max(5, Math.min(30, opts.days * 1.5));
      break;
    case "fees":
      baseline = profile.mealCost * 0.6 * Math.max(1, opts.days) * 0.5 * travelers;
      break;
  }
  const mult = category === "flights" || category === "insurance" ? 1 : profile.mult[category] ?? 1;
  const multiplied = baseline * mult * season;

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

/** Three budget scenarios around the realistic suggestion. */
export const buildScenarios = (realistic: number) => ({
  economy: Math.max(1, Math.round(realistic * 0.75)),
  realistic: Math.max(1, Math.round(realistic)),
  comfort: Math.max(1, Math.round(realistic * 1.35)),
});

const CLASSIFY_RULES: Array<[CategoryKey, RegExp]> = [
  ["flights", /\b(vol|vols|flight|avion|plane|airline|billet d'avion|train aller|ferry|easyjet|ryanair|air france|sncf|tgv|ouigo|eurostar)\b/i],
  ["accommodation", /(h[oô]tel|hostel|auberge|airbnb|booking|logement|nuit|night|g[iî]te|camping|ryokan|room|chambre|apartment|appart)/i],
  ["localTransport", /(m[eé]tro|metro|bus|tram|taxi|uber|bolt|grab|tuk|train|ticket transport|navigo|pass transport|essence|fuel|gas|parking|location voiture|car rental|scooter|v[eé]lo|bike)/i],
  ["food", /(resto|restaurant|repas|meal|d[eé]jeuner|d[iî]ner|lunch|dinner|breakfast|petit[- ]d[eé]j|caf[eé]|coffee|bar|bi[eè]re|beer|vin|wine|boulangerie|bakery|march[eé]|market|supermarch[eé]|grocery|courses|snack|glace|street food|pizza|sushi|tapas)/i],
  ["activities", /(mus[eé]e|museum|visite|tour|excursion|entr[eé]e|ticket|billet|concert|spectacle|show|parc|park|plong[eé]e|diving|surf|randonn[eé]e|hike|cours|class|spa|massage|temple|ch[aâ]teau)/i],
  ["shopping", /(shopping|souvenir|v[eê]tement|clothes|cadeau|gift|boutique|store|magasin|achat)/i],
  ["insurance", /(assurance|insurance|pharmacie|pharmacy|m[eé]decin|doctor|h[oô]pital|m[eé]dicament|vaccin)/i],
  ["connectivity", /(sim|esim|e-sim|roaming|data|internet|wifi|forfait|airalo|holafly)/i],
  ["fees", /(frais|fee|commission|retrait|atm|change|exchange|pourboire|tip|visa|taxe|tax)/i],
];

/** Guess the expense category from a free-text comment. Returns null when unsure. */
export const classifyExpense = (text: string): CategoryKey | null => {
  const s = (text || "").trim();
  if (!s) return null;
  for (const [key, re] of CLASSIFY_RULES) if (re.test(s)) return key;
  return null;
};
