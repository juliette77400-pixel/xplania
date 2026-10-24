// Budget guide numbers: indicators, costs before / during / after the stay,
// money coming in during the stay, the first month, computed recommendations
// and the simulator. Pure functions only.

export interface BudgetLine {
  key: string;
  planned: number;
  spent: number;
}

export interface BudgetExpenseLike {
  amount: number;
}

/** Paid before leaving or when arriving (tickets, insurance, fees, deposit, moving in). */
export const BEFORE_KEYS = ["flights", "insurance", "fees", "deposit", "setup"] as const;
/** Paid at the end of the stay. */
export const END_KEYS = ["returnFees"] as const;
const isBefore = (key: string) => (BEFORE_KEYS as readonly string[]).includes(key);
const isEnd = (key: string) => (END_KEYS as readonly string[]).includes(key);
const isOneOff = (key: string) => isBefore(key) || isEnd(key);

export const DAYS_PER_MONTH = 30.44;

/** Money coming in during the stay, on top of the starting budget. */
export interface BudgetIncomes {
  /** Erasmus or other grant, per month. */
  grantMonthly: number;
  /** Internship pay or student job, per month. */
  payMonthly: number;
  /** Family help, per month. */
  familyMonthly: number;
  /** Other one-off money (housing aid lump sum, gift…), total. */
  otherTotal: number;
}

export const emptyIncomes = (): BudgetIncomes => ({ grantMonthly: 0, payMonthly: 0, familyMonthly: 0, otherTotal: 0 });

export function sanitizeIncomes(raw: unknown): BudgetIncomes {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const v = (k: keyof BudgetIncomes) => Math.max(0, Math.round(Number(r[k]) || 0));
  return { grantMonthly: v("grantMonthly"), payMonthly: v("payMonthly"), familyMonthly: v("familyMonthly"), otherTotal: v("otherTotal") };
}

export interface BudgetSummary {
  /** Starting budget from the questionnaire (0 = not given). */
  budget: number;
  /** Money coming in during the stay. */
  incomeMonthly: number;
  incomeTotal: number;
  /** Starting budget + money coming in. */
  resources: number;
  /** Sum of the estimated amounts of every category. */
  estimated: number;
  /** Sum of the payments the student recorded. */
  paid: number;
  /** Estimated minus paid (never below 0). */
  toPay: number;
  /** Resources minus estimate (null when neither a budget nor incomes were given). */
  margin: number | null;
  before: number;
  end: number;
  recurring: number;
  /** Refundable part of "before" (housing deposit). */
  deposit: number;
  /** Stay length in months (1 decimal), 0 when unknown. */
  months: number;
  /** Recurring costs per month, null for stays shorter than a month. */
  monthly: number | null;
  /** Money needed for departure + arrival + the first month there. */
  firstMonth: number;
}

const round = (n: number) => Math.round(n);
const sumOf = (lines: BudgetLine[], pred: (k: string) => boolean) =>
  round(lines.filter((l) => pred(l.key)).reduce((s, l) => s + (Number(l.planned) || 0), 0));

export function monthsOf(days: number): number {
  return days > 0 ? Math.round((days / DAYS_PER_MONTH) * 10) / 10 : 0;
}

export function summarizeBudget(
  lines: BudgetLine[],
  expenses: BudgetExpenseLike[],
  budget: number,
  days: number,
  incomes: BudgetIncomes = emptyIncomes(),
): BudgetSummary {
  const estimated = sumOf(lines, () => true);
  const paid = round(expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const before = sumOf(lines, isBefore);
  const end = sumOf(lines, isEnd);
  const recurring = estimated - before - end;
  const months = monthsOf(days);
  const monthly = months >= 1 ? round(recurring / months) : null;
  const incomeMonthly = incomes.grantMonthly + incomes.payMonthly + incomes.familyMonthly;
  const incomeTotal = round(incomeMonthly * Math.max(months, incomeMonthly > 0 ? 1 : 0) + incomes.otherTotal);
  const base = budget > 0 ? round(budget) : 0;
  const resources = base + incomeTotal;
  return {
    budget: base,
    incomeMonthly,
    incomeTotal,
    resources,
    estimated,
    paid,
    toPay: Math.max(0, estimated - paid),
    margin: resources > 0 ? resources - estimated : null,
    before,
    end,
    recurring,
    deposit: sumOf(lines, (k) => k === "deposit"),
    months,
    monthly,
    firstMonth: before + (monthly ?? recurring),
  };
}

export type RecommendationId =
  | "overBudget" | "firstMonthTight" | "reserve" | "incomeMissing" | "biggestShare" | "trackPayments" | "onTrack";
export interface Recommendation {
  id: RecommendationId;
  tone: "warn" | "info" | "good";
  values: Record<string, string | number>;
}

/** Up to three recommendations computed from the student's own numbers (most urgent first). */
export function budgetRecommendations(
  lines: BudgetLine[],
  s: BudgetSummary,
  daysUntilDeparture: number | null,
  incomesGiven = false,
): Recommendation[] {
  const out: Recommendation[] = [];
  const recurringLines = lines.filter((l) => !isOneOff(l.key) && l.key !== "unexpected");
  const biggest = [...recurringLines].sort((a, b) => b.planned - a.planned)[0];

  if (s.margin !== null && s.margin < 0) {
    const cut = biggest ? round(Math.min(-s.margin, biggest.planned * 0.2)) : -s.margin;
    out.push({ id: "overBudget", tone: "warn", values: { amount: -s.margin, key: biggest?.key || "", cut } });
  }
  if (s.budget > 0 && s.months >= 1 && s.firstMonth > s.budget) {
    out.push({ id: "firstMonthTight", tone: "warn", values: { amount: s.firstMonth, missing: s.firstMonth - s.budget } });
  }
  const reserve = lines.find((l) => l.key === "unexpected")?.planned ?? 0;
  const target = round(s.estimated * 0.05);
  if (s.estimated > 0 && reserve < target) out.push({ id: "reserve", tone: "warn", values: { current: round(reserve), target } });
  if (s.months >= 1 && !incomesGiven) out.push({ id: "incomeMissing", tone: "info", values: {} });
  if (biggest && s.estimated > 0) {
    const share = round((biggest.planned / s.estimated) * 100);
    if (share >= 35) out.push({ id: "biggestShare", tone: "info", values: { key: biggest.key, share } });
  }
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
