import { describe, expect, it } from "vitest";
import { emptyIncomes, budgetRecommendations, changedLines, simulateBudget, summarizeBudget } from "@/lib/budget-math";

const lines = [
  { key: "flights", planned: 600, spent: 0 },
  { key: "insurance", planned: 200, spent: 0 },
  { key: "accommodation", planned: 2500, spent: 0 },
  { key: "food", planned: 1000, spent: 0 },
  { key: "localTransport", planned: 200, spent: 0 },
  { key: "unexpected", planned: 50, spent: 0 },
];

describe("budget math", () => {
  it("splits costs paid before leaving (flights, insurance) from monthly costs", () => {
    const s = summarizeBudget(lines, [], 5000, 152);
    expect(s.before).toBe(800);
    expect(s.recurring).toBe(3750);
    expect(s.months).toBe(5);
    expect(s.monthly).toBe(750);
  });

  it("paid comes from recorded payments and 'to pay' is estimate minus paid", () => {
    const s = summarizeBudget(lines, [{ amount: 600 }, { amount: 150 }], 5000, 152);
    expect(s.paid).toBe(750);
    expect(s.toPay).toBe(3800);
  });

  it("margin is budget minus estimate, and unknown when no budget was given", () => {
    expect(summarizeBudget(lines, [], 5000, 152).margin).toBe(450);
    expect(summarizeBudget(lines, [], 0, 152).margin).toBeNull();
  });

  it("no monthly figure for stays shorter than a month", () => {
    expect(summarizeBudget(lines, [], 5000, 20).monthly).toBeNull();
  });

  it("warns first when the estimate is over budget", () => {
    const s = summarizeBudget(lines, [], 4000, 152);
    expect(budgetRecommendations(lines, s, null)[0]).toMatchObject({ id: "overBudget", values: { amount: 550 } });
  });

  it("asks for a reserve of at least 5% of the estimate", () => {
    const s = summarizeBudget(lines, [], 5000, 152);
    const r = budgetRecommendations(lines, s, null).find((x) => x.id === "reserve");
    expect(r?.values).toEqual({ current: 50, target: 228 });
  });

  it("never returns more than three recommendations", () => {
    const s = summarizeBudget(lines, [], 4000, 152);
    expect(budgetRecommendations(lines, s, 30).length).toBeLessThanOrEqual(3);
  });

  it("simulator multiplies monthly rent and food by the stay length and leaves flights alone", () => {
    const { lines: next } = simulateBudget(lines, 152, { accommodationMonthly: 400, foodMonthly: 250, reservePct: 10 });
    expect(next.find((l) => l.key === "accommodation")?.planned).toBe(2000);
    expect(next.find((l) => l.key === "food")?.planned).toBe(1250);
    expect(next.find((l) => l.key === "flights")?.planned).toBe(600);
    expect(next.find((l) => l.key === "unexpected")?.planned).toBe(425);
  });

  it("lists only the lines the simulator changes", () => {
    const { lines: next } = simulateBudget(lines, 152, { accommodationMonthly: 400, foodMonthly: 200, reservePct: 1 });
    expect(changedLines(lines, next).map((c) => c.key)).toEqual(["accommodation", "unexpected"]);
  });

  it("deposit and moving-in are paid before; return costs at the end", () => {
    const long = [...lines, { key: "deposit", planned: 500, spent: 0 }, { key: "setup", planned: 150, spent: 0 }, { key: "returnFees", planned: 80, spent: 0 }];
    const s = summarizeBudget(long, [], 5000, 152);
    expect(s.before).toBe(1450);
    expect(s.end).toBe(80);
    expect(s.deposit).toBe(500);
    expect(s.recurring).toBe(3750);
  });

  it("first month = everything paid before + one month of living costs", () => {
    const long = [...lines, { key: "deposit", planned: 500, spent: 0 }];
    expect(summarizeBudget(long, [], 5000, 152).firstMonth).toBe(1300 + 750);
  });

  it("Erasmus grant and internship pay add to resources over the whole stay", () => {
    const s = summarizeBudget(lines, [], 2000, 152, { ...emptyIncomes(), grantMonthly: 400, payMonthly: 600, otherTotal: 300 });
    expect(s.incomeMonthly).toBe(1000);
    expect(s.incomeTotal).toBe(5300);
    expect(s.resources).toBe(7300);
    expect(s.margin).toBe(7300 - 4550);
  });

  it("warns when the first month costs more than the starting budget", () => {
    const s = summarizeBudget(lines, [], 1000, 152);
    expect(budgetRecommendations(lines, s, null).some((r) => r.id === "firstMonthTight")).toBe(true);
  });

  it("asks for incomes on long stays when none were given", () => {
    const s = summarizeBudget(lines, [], 9000, 152);
    expect(budgetRecommendations(lines, s, null, false).map((r) => r.id)).toContain("incomeMissing");
    expect(budgetRecommendations(lines, s, null, true).map((r) => r.id)).not.toContain("incomeMissing");
  });
});
