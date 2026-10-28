// Picks the 2–3 optimisation ideas to show first, based on the student's real numbers.
import type { BudgetInsights, BudgetPlace } from "@/hooks/useBudgetInsights";

export type DealGroup = keyof BudgetInsights["deals"];
export const DEAL_GROUPS: DealGroup[] = ["activities", "restaurants", "transport", "mood"];
/** Which budget line each group of ideas helps with. */
export const DEAL_CATEGORY: Record<DealGroup, string> = { activities: "activities", restaurants: "food", transport: "localTransport", mood: "extras" };

export const MAX_OPTIMISATIONS = 3;

export interface PrioritizedDeal extends BudgetPlace { group: DealGroup }

/**
 * Groups whose budget line is under the most pressure come first (spent / planned, then size of the line);
 * then one idea per group in turn, so the short list covers several spending lines.
 */
export function prioritizeDeals(
  deals: BudgetInsights["deals"] | null | undefined,
  categories: { key: string; planned: number; spent: number }[],
  max = MAX_OPTIMISATIONS,
): PrioritizedDeal[] {
  if (!deals) return [];
  const pressure = (g: DealGroup) => {
    const c = categories.find((x) => x.key === DEAL_CATEGORY[g]);
    const planned = Number(c?.planned) || 0;
    const spent = Number(c?.spent) || 0;
    return { ratio: planned > 0 ? spent / planned : 0, planned };
  };
  const order = DEAL_GROUPS
    .filter((g) => (deals[g] || []).length > 0)
    .sort((a, b) => {
      const pa = pressure(a), pb = pressure(b);
      return pb.ratio - pa.ratio || pb.planned - pa.planned;
    });
  const out: PrioritizedDeal[] = [];
  for (let round = 0; out.length < max; round++) {
    let added = false;
    for (const g of order) {
      const d = deals[g][round];
      if (d && out.length < max) { out.push({ ...d, group: g }); added = true; }
    }
    if (!added) break;
  }
  return out;
}

export type BudgetAlert = { key: string; type: "danger" | "warning" | "success" };

/** Alerts only come from real gaps between planned and spent amounts: nothing is invented. */
export function budgetAlerts(categories: { key: string; planned: number; spent: number }[]): BudgetAlert[] {
  const out: BudgetAlert[] = [];
  for (const cat of categories) {
    const planned = Number(cat.planned) || 0;
    const spent = Number(cat.spent) || 0;
    if (planned <= 0 && spent <= 0) continue;
    const ratio = planned > 0 ? spent / planned : 2;
    if (ratio > 1) out.push({ key: cat.key, type: "danger" });
    else if (ratio > 0.8) out.push({ key: cat.key, type: "warning" });
    else if (ratio < 0.5 && spent > 0) out.push({ key: cat.key, type: "success" });
  }
  // Most serious first.
  const rank = { danger: 0, warning: 1, success: 2 };
  return out.sort((a, b) => rank[a.type] - rank[b.type]);
}
