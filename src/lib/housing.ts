// Rules of the housing assistant (5th preparation tool). Pure functions so they
// can be tested without rendering: which steps apply to each search status,
// how costs are computed and how housing costs are written into the budget.

export const HOUSING_STATUSES = ["starting", "shortlist", "confirmed", "lost"] as const;
export type HousingStatus = (typeof HOUSING_STATUSES)[number];

export const isHousingStatus = (v: unknown): v is HousingStatus =>
  typeof v === "string" && (HOUSING_STATUSES as readonly string[]).includes(v);

export const HOUSING_TYPES = ["residence", "flatshare", "studio", "family", "other"] as const;
export type HousingType = (typeof HOUSING_TYPES)[number];

/** Checks done before booking or signing (module 3). */
export const SAFETY_ITEMS = [
  "owner", "contract", "rent", "deposit", "cancel", "reviews", "address", "payment", "keys",
] as const;

/** Steps (module 4), grouped by phase. Each status only sees the phases that matter now. */
export const INSTALL_PHASES = {
  gettingStarted: ["contactSchool", "maxRent", "housingType", "shortlist"],
  beforeSigning: ["conditions", "documents", "fees", "visit"],
  beforeDeparture: ["arrival", "upfront", "equipment", "keysPickup", "route"],
  arrival: ["inventory", "checkEquipment", "keepDocs", "localSteps"],
} as const;
export type InstallPhase = keyof typeof INSTALL_PHASES;

export type HousingSection = "resources" | "compare" | "safety" | "install";

/**
 * Blocks shown for each status, most useful first. Steps that do not apply yet
 * (or any more) are left out: no move-in checklist before a home is in sight,
 * no "where to look" once the home is confirmed.
 */
export function sectionOrder(status: HousingStatus | null): HousingSection[] {
  switch (status) {
    case "confirmed":
      return ["install", "compare", "safety"];
    case "shortlist":
      return ["compare", "safety", "install", "resources"];
    case "lost":
      return ["resources", "install", "compare", "safety"];
    default:
      return ["resources", "compare", "install", "safety"];
  }
}

/** Step phases shown for a status. */
export function phasesForStatus(status: HousingStatus | null): InstallPhase[] {
  switch (status) {
    case "confirmed":
      return ["beforeDeparture", "arrival"];
    case "shortlist":
      return ["beforeSigning"];
    default:
      return ["gettingStarted"];
  }
}

/** The 9 checks before booking only make sense once homes are spotted; otherwise warning signs are shown as reminders. */
export const safetyChecksApply = (status: HousingStatus | null): boolean => status === "shortlist";

/** Status suggested once the current steps are done (null when nothing comes next). */
export function nextStatus(status: HousingStatus | null): HousingStatus | null {
  if (status === "confirmed") return null;
  if (status === "shortlist") return "confirmed";
  return "shortlist";
}

/** Every checklist id that counts toward progress for this status. */
export function checklistIds(status: HousingStatus | null): string[] {
  const install = phasesForStatus(status).flatMap((p) => INSTALL_PHASES[p].map((i) => `install:${p}:${i}`));
  return safetyChecksApply(status) ? [...SAFETY_ITEMS.map((i) => `safety:${i}`), ...install] : install;
}

/** Progress counted only on the items that apply to the current status. */
export function housingProgress(status: HousingStatus | null, checked: Iterable<string>): { done: number; total: number } {
  const ids = checklistIds(status);
  const set = new Set(checked);
  return { done: ids.filter((id) => set.has(id)).length, total: ids.length };
}

export interface HousingCosts {
  monthly_rent: number;
  charges_included?: boolean | null;
  monthly_charges?: number | null;
  deposit?: number | null;
  extra_fees?: number | null;
}

const n = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);

/** Known monthly cost: rent, plus charges when they are not included. */
export function monthlyCost(o: HousingCosts): number {
  return n(o.monthly_rent) + (o.charges_included ? 0 : n(o.monthly_charges));
}

/** Estimated cost to move in: first month + deposit + extra fees. */
export function upfrontCost(o: HousingCosts): number {
  return monthlyCost(o) + n(o.deposit) + n(o.extra_fees);
}

/** Months used to plan rent in the budget (rounded up, at least 1). */
export function stayMonths(durationDays: string | number | null | undefined): number | null {
  const d = typeof durationDays === "number" ? durationDays : parseInt(durationDays || "", 10);
  if (!Number.isFinite(d) || d <= 0) return null;
  return Math.max(1, Math.ceil(d / 30));
}

// ---------- Budget link ----------

export interface BudgetCategoryLike {
  key: string;
  planned: number;
  [k: string]: unknown;
}

/** What the housing assistant last wrote into a budget (to replace it, never add twice). */
export interface HousingBudgetSync {
  optionId: string;
  accommodation: number;
  deposit: number;
}

export interface HousingBudgetPlan {
  monthly: number;
  months: number;
  oneOff: number;
  deposit: number;
  /** Planned "accommodation" amount after the update. */
  accommodation: number;
}

export function housingBudgetPlan(o: HousingCosts, months: number): HousingBudgetPlan {
  const m = Math.max(1, Math.round(months));
  const monthly = monthlyCost(o);
  const oneOff = n(o.extra_fees);
  return { monthly, months: m, oneOff, deposit: n(o.deposit), accommodation: Math.round(monthly * m + oneOff) };
}

/**
 * Applies a housing plan to the budget categories. The accommodation line is
 * replaced; the deposit is kept in "fees" and the previous housing deposit is
 * removed first, so repeating the action never counts the same home twice.
 */
export function applyHousingToBudget<T extends BudgetCategoryLike>(
  categories: T[],
  plan: HousingBudgetPlan,
  previous: HousingBudgetSync | null,
): T[] {
  return categories.map((c) => {
    if (c.key === "accommodation") return { ...c, planned: plan.accommodation };
    if (c.key === "fees") {
      const base = Math.max(0, (Number(c.planned) || 0) - (previous?.deposit ?? 0));
      return { ...c, planned: Math.round(base + plan.deposit) };
    }
    return c;
  });
}

export const budgetStorageKey = (destination: string | null | undefined, departureDate: string | null | undefined) =>
  `xplania-budget-state::${destination || "Paris"}::${departureDate || "na"}`;
export const housingSyncKey = (tripId: string) => `xplania-housing-budget-sync::${tripId}`;
