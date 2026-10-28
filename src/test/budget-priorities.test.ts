import { describe, expect, it } from "vitest";
import { budgetAlerts, prioritizeDeals } from "@/lib/budget-priorities";
import { filterNewDeals } from "@/hooks/useBudgetInsights";

const place = (name: string) => ({ name, zone: "centre", city: "Madrid", detail: "≈ 5 €" });
const deals = {
  activities: [place("A1"), place("A2")],
  restaurants: [place("R1"), place("R2")],
  transport: [place("T1"), place("T2")],
  mood: [place("M1")],
};

describe("Budget : alertes et optimisations", () => {
  it("aucune alerte quand les dépenses restent sous le prévu", () => {
    expect(budgetAlerts([{ key: "food", planned: 300, spent: 200 }])).toEqual([]);
  });

  it("une alerte seulement pour un vrai dépassement, la plus grave en premier", () => {
    const a = budgetAlerts([
      { key: "food", planned: 300, spent: 270 },
      { key: "localTransport", planned: 50, spent: 80 },
    ]);
    expect(a.map((x) => [x.key, x.type])).toEqual([["localTransport", "danger"], ["food", "warning"]]);
  });

  it("3 optimisations au maximum, d'abord pour le poste qui dépasse", () => {
    const out = prioritizeDeals(deals, [
      { key: "localTransport", planned: 50, spent: 80 },
      { key: "food", planned: 300, spent: 100 },
    ]);
    expect(out).toHaveLength(3);
    expect(out[0].name).toBe("T1");
  });

  it("Régénérer écarte les idées déjà montrées, même écrites autrement", () => {
    const fresh = filterNewDeals(deals, ["a1", "Ré1", "T1 ", "R1"]);
    expect(fresh.activities.map((d) => d.name)).toEqual(["A2"]);
    expect(fresh.restaurants.map((d) => d.name)).toEqual(["R2"]);
    expect(fresh.transport.map((d) => d.name)).toEqual(["T2"]);
  });

  it("si tout a déjà été montré, il ne reste rien de « nouveau »", () => {
    const fresh = filterNewDeals(deals, ["A1", "A2", "R1", "R2", "T1", "T2", "M1"]);
    expect(Object.values(fresh).flat()).toHaveLength(0);
  });
});
