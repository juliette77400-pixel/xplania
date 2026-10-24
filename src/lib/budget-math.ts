// Budget guide numbers: the five indicators, one-off vs monthly costs, the
// three computed recommendations and the simulator. Pure functions only.

export interface BudgetLine {
  key: string;
  planned: number;
  spent: number;
}

export interface BudgetExpenseLike {
  amount: number;
}

/** Paid once before or at the start of the stay. Every other category repeats each month. */
export const ONE_OFF_KEYS = ["flights", "insurance", "fees"] as const;
const isOneOff = (key: string) => (ONE_OFF_KEYS as readonly string[]).includes(key);

export const DAYS_PER_MONTH = 30.44;

export interface BudgetSummary {
  /** Budget the student gave in the questionnaire (0 = not given). */
  budget: number;
  /** Sum of the estimated amounts of every category. */
  estimated: number;
  /** Sum of the payments the student recorded. */
  paid: number;
  /** Estimated minus paid (never below 0). */
  toPay: number;
  /** Budget minus estimate (null when no budget was given). */
  margin: number | null;
  oneOff: number;
  recurring: number;
  /** Stay length in months (1 decimal), 0 when unknown. */
  months: number;
  /** Recurring costs per month, null for stays shorter than a month. */
  monthly: number | null;
}

const round = (n: number) => Math.round(n);

export function monthsOf(days: number): number {
  return days > 0 ? Math.round((days / DAYS_PER_MONTH) * 10) / 10 : 0;
}

export function summarizeBudget(lines: BudgetLine[], expenses: BudgetExpenseLike[], budget: number, days: number): BudgetSummary {
  const estimated = round(lines.reduce((s, l) => s + (Number(l.planned) || 0), 0));
  const paid = round(expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const oneOff = round(lines.filter((l) => isOneOff(l.key)).reduce((s, l) => s + (Number(l.planned) || 0), 0));
  const recurring = estimated - oneOff;
  const months = monthsOf(days);
  return {
    budget: budget > 0 ? round(budget) : 0,
    estimated,
    paid,
    toPay: Math.max(0, estimated - paid),
    margin: budget > 0 ? round(budget - estimated) : null,
    oneOff,
    recurring,
    months,
    monthly: months >= 1 ? round(recurring / months) : null,
  };
}

export type RecommendationId = "overBudget" | "biggestShare" | "reserve" | "trackPayments" | "onTrack";
export interface Recommendation {
  id: RecommendationId;
  tone: "warn" | "info" | "good";
  values: Record<string, string | number>;
}

/** Up to three recommendations computed from the student's own numbers. */
export function budgetRecommendations(lines: BudgetLine[], s: BudgetSummary, daysUntilDeparture: number | null): Recommendation[] {
  const out: Recommendation[] = [];
  const recurringLines = lines.filter((l) => !isOneOff(l.key) && l.key !== "unexpected");
  const biggest = [...recurringLines].sort((a, b) => b.planned - a.planned)[0];

  if (s.margin !== null && s.margin < 0) {
    const cut = biggest ? round(Math.min(-s.margin, biggest.planned * 0.2)) : -s.margin;
    out.push({ id: "overBudget", tone: "warn", values: { amount: -s.margin, key: biggest?.key || "", cut } });
  }
  if (biggest && s.estimated > 0) {
    const share = round((biggest.planned / s.estimated) * 100);
    if (share >= 35) out.push({ id: "biggestShare", tone: "info", values: { key: biggest.key, share } });
  }
  const reserve = lines.find((l) => l.key === "unexpected")?.planned ?? 0;
  const target = round(s.estimated * 0.05);
  if (s.estimated > 0 && reserve < target) out.push({ id: "reserve", tone: "warn", values: { current: round(reserve), target } });
  if (s.paid === 0 && daysUntilDeparture !== null && daysUntilDeparture <= 90) out.push({ id: "trackPayments", tone: "info", values: { days: Math.max(0, daysUntilDeparture) } });
  if (out.length === 0 && s.margin !== null) out.push({ id: "onTrack", tone: "good", values: { amount: s.margin } });
  return out.slice(0, 3);
}

export interface SimulatorInput {
  accommodationMonthly: number;
  foodMonthly: number;
  /** Safety reserve as a share of the other costs, in percent. */
  reservePct: number;
}

/** Current monthly values used to pre-fill the simulator. */
export function simulatorDefaults(lines: BudgetLine[], days: number): SimulatorInput {
  const months = Math.max(monthsOf(days), 1);
  const get = (k: string) => lines.find((l) => l.key === k)?.planned ?? 0;
  const others = lines.filter((l) => l.key !== "unexpected").reduce((s, l) => s + l.planned, 0);
  return {
    accommodationMonthly: round(get("accommodation") / months),
    foodMonthly: round(get("food") / months),
    reservePct: others > 0 ? Math.min(30, round((get("unexpected") / others) * 100)) : 5,
  };
}

/** New planned amounts for accommodation, food and reserve; other lines unchanged. */
export function simulateBudget(lines: BudgetLine[], days: number, input: SimulatorInput): { lines: BudgetLine[]; total: number } {
  const months = Math.max(monthsOf(days), 1);
  const accommodation = round(Math.max(0, input.accommodationMonthly) * months);
  const food = round(Math.max(0, input.foodMonthly) * months);
  const others = lines
    .filter((l) => !["accommodation", "food", "unexpected"].includes(l.key))
    .reduce((s, l) => s + l.planned, 0);
  const reserve = round(((others + accommodation + food) * Math.max(0, Math.min(30, input.reservePct))) / 100);
  const next = lines.map((l) =>
    l.key === "accommodation" ? { ...l, planned: accommodation }
      : l.key === "food" ? { ...l, planned: food }
        : l.key === "unexpected" ? { ...l, planned: reserve }
          : l,
  );
  return { lines: next, total: round(next.reduce((s, l) => s + l.planned, 0)) };
}

/** Lines whose planned amount differs (used by the confirmation dialog). */
export function changedLines(before: BudgetLine[], after: BudgetLine[]): Array<{ key: string; from: number; to: number }> {
  return after
    .map((a) => ({ key: a.key, from: before.find((b) => b.key === a.key)?.planned ?? 0, to: a.planned }))
    .filter((c) => c.from !== c.to);
}
