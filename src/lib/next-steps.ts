// "What's left to prepare?" — one list across the five tools, most urgent
// first, built from what each tool saved (Visa checklist, Budget numbers,
// housing status, module progress). No AI, no new data.
import { findCountry } from "@/lib/country-match";
import { nextActionKey, type ModuleProgress, type PrepModule } from "@/lib/prep-progress";
import { loadVisaState, visaStateKey } from "@/lib/visa-rules";
import { sanitizeIncomes, summarizeBudget, type BudgetLine } from "@/lib/budget-math";

export interface NextStep {
  id: string;
  module: PrepModule;
  /** i18n key, or null when `text` is the student's own checklist item. */
  key: string | null;
  text?: string;
  vars?: Record<string, string | number>;
  /** 1 = most urgent. */
  urgency: number;
}

export interface VisaSnapshot {
  analysed: boolean;
  outstanding: Array<{ id: string; item: string; priority: string }>;
}

export interface BudgetSnapshot {
  generated: boolean;
  margin: number | null;
  firstMonthGap: number;
  incomesGiven: boolean;
  longStay: boolean;
}

export interface NextStepsInput {
  enabled: PrepModule[];
  progress: Record<PrepModule, ModuleProgress>;
  visa: VisaSnapshot | null;
  budget: BudgetSnapshot | null;
  housingStatus: string | null;
}

export function buildNextSteps(i: NextStepsInput, max = 6): NextStep[] {
  const on = (m: PrepModule) => i.enabled.includes(m);
  const out: NextStep[] = [];

  if (on("visa")) {
    if (!i.visa?.analysed) out.push({ id: "visa-analyse", module: "visa", key: "prepDashboard.steps.visaAnalyse", urgency: 1 });
    else {
      const required = i.visa.outstanding.filter((x) => x.priority === "required");
      required.slice(0, 2).forEach((x) => out.push({ id: `visa-${x.id}`, module: "visa", key: null, text: x.item, urgency: 1 }));
      if (required.length > 2) out.push({ id: "visa-more", module: "visa", key: "prepDashboard.steps.visaMore", vars: { count: required.length - 2 }, urgency: 2 });
      const rec = i.visa.outstanding.find((x) => x.priority === "recommended");
      if (rec) out.push({ id: `visa-${rec.id}`, module: "visa", key: null, text: rec.item, urgency: 4 });
    }
  }

  if (on("budget")) {
    if (!i.budget?.generated) out.push({ id: "budget-start", module: "budget", key: "prepDashboard.steps.budgetStart", urgency: 2 });
    else {
      if (i.budget.margin !== null && i.budget.margin < 0) out.push({ id: "budget-over", module: "budget", key: "prepDashboard.steps.budgetOver", vars: { amount: -i.budget.margin }, urgency: 1 });
      if (i.budget.firstMonthGap > 0) out.push({ id: "budget-first", module: "budget", key: "prepDashboard.steps.budgetFirstMonth", vars: { amount: i.budget.firstMonthGap }, urgency: 2 });
      if (i.budget.longStay && !i.budget.incomesGiven) out.push({ id: "budget-income", module: "budget", key: "prepDashboard.steps.budgetIncome", urgency: 3 });
    }
  }

  if (on("housing")) {
    const key = nextActionKey("housing", i.progress.housing);
    if (i.housingStatus !== "confirmed") out.push({ id: "housing", module: "housing", key: key || "prepDashboard.steps.housingFind", urgency: 2 });
    else if (key) out.push({ id: "housing", module: "housing", key, urgency: 4 });
  }

  for (const m of ["valise", "culture"] as const) {
    if (!on(m)) continue;
    const key = nextActionKey(m, i.progress[m]);
    if (key) out.push({ id: m, module: m, key, urgency: 5 });
  }

  return out.sort((a, b) => a.urgency - b.urgency).slice(0, max);
}

// ── Readers of what the tools saved in this browser ──

export function readVisaSnapshot(tripId: string, destination: string | null | undefined): VisaSnapshot | null {
  const code = findCountry(destination);
  if (!code) return null;
  const s = loadVisaState(visaStateKey(tripId, code));
  if (!s) return { analysed: false, outstanding: [] };
  return {
    analysed: true,
    outstanding: s.analysis.checklist.filter((c) => !s.checked[c.id]).map((c) => ({ id: c.id, item: c.item, priority: c.priority })),
  };
}

export function readBudgetSnapshot(
  destination: string | null | undefined,
  departureDate: string | null | undefined,
  form: { totalBudget?: number; duration?: string } | null | undefined,
  durationColumn?: number | null,
): BudgetSnapshot | null {
  try {
    const raw = localStorage.getItem(`xplania-budget-state::${destination || "Paris"}::${departureDate || "na"}`);
    const st = raw ? JSON.parse(raw) : null;
    const days = Number(form?.duration) || Number(durationColumn) || 0;
    if (!st?.hasGenerated || !Array.isArray(st.categories)) return { generated: false, margin: null, firstMonthGap: 0, incomesGiven: false, longStay: days >= 28 };
    const lines: BudgetLine[] = st.categories.map((c: { key: string; planned?: number; spent?: number }) => ({ key: c.key, planned: Number(c.planned) || 0, spent: Number(c.spent) || 0 }));
    const budget = Number(form?.totalBudget) || 0;
    const s = summarizeBudget(lines, Array.isArray(st.expenses) ? st.expenses : [], budget, days, sanitizeIncomes(st.incomes));
    return {
      generated: true,
      margin: s.margin,
      firstMonthGap: budget > 0 && s.months >= 1 ? Math.max(0, s.firstMonth - budget) : 0,
      incomesGiven: !!st.incomes,
      longStay: s.months >= 1,
    };
  } catch {
    return null;
  }
}
