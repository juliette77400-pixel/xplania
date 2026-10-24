import { describe, expect, it } from "vitest";
import { buildNextSteps, type NextStepsInput } from "@/lib/next-steps";

const empty = { done: 0, total: 0 };
const base: NextStepsInput = {
  enabled: ["budget", "visa", "valise", "culture", "housing"],
  progress: { budget: empty, visa: empty, valise: empty, culture: empty, housing: empty },
  visa: { analysed: true, outstanding: [] },
  budget: { generated: true, margin: 500, firstMonthGap: 0, incomesGiven: true, longStay: true },
  housingStatus: "confirmed",
};

describe("what's left to prepare", () => {
  it("lists unchecked required Visa steps first, with the student's own wording", () => {
    const steps = buildNextSteps({ ...base, visa: { analysed: true, outstanding: [{ id: "visa-app", item: "Demander le visa étudiant", priority: "required" }] } });
    expect(steps[0]).toMatchObject({ module: "visa", text: "Demander le visa étudiant", urgency: 1 });
  });

  it("asks to run the Visa analysis when it was never done", () => {
    expect(buildNextSteps({ ...base, visa: null })[0].key).toBe("prepDashboard.steps.visaAnalyse");
  });

  it("flags a budget shortfall with its amount", () => {
    const steps = buildNextSteps({ ...base, budget: { ...base.budget!, margin: -1200 } });
    expect(steps.find((s) => s.id === "budget-over")?.vars).toEqual({ amount: 1200 });
  });

  it("asks for grant or internship pay on long stays only", () => {
    const long = buildNextSteps({ ...base, budget: { ...base.budget!, incomesGiven: false } });
    const short = buildNextSteps({ ...base, budget: { ...base.budget!, incomesGiven: false, longStay: false } });
    expect(long.some((s) => s.id === "budget-income")).toBe(true);
    expect(short.some((s) => s.id === "budget-income")).toBe(false);
  });

  it("hidden tools never appear in the list", () => {
    const steps = buildNextSteps({ ...base, enabled: ["budget"], visa: null });
    expect(steps.every((s) => s.module === "budget")).toBe(true);
  });

  it("shows at most six steps", () => {
    const outstanding = Array.from({ length: 10 }, (_, i) => ({ id: `x${i}`, item: `Étape ${i}`, priority: "required" }));
    expect(buildNextSteps({ ...base, visa: { analysed: true, outstanding }, housingStatus: "starting" }).length).toBeLessThanOrEqual(6);
  });
});
