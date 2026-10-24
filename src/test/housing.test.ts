import { describe, expect, it } from "vitest";
import {
  applyHousingToBudget, checklistIds, housingBudgetPlan, housingProgress, monthlyCost, phasesForStatus, sectionOrder, stayMonths, upfrontCost,
} from "@/lib/housing";
import { resourcesForCountry, HOUSING_RESOURCES } from "@/data/housing-resources";
import { overallPercent, readTripProgress } from "@/lib/prep-progress";

const home = { monthly_rent: 500, charges_included: false, monthly_charges: 50, deposit: 1000, extra_fees: 200 };

describe("assistant logement — personnalisation", () => {
  it("commence par les ressources quand l'étudiant débute ou est perdu", () => {
    expect(sectionOrder("starting")[0]).toBe("resources");
    expect(sectionOrder("lost")[0]).toBe("resources");
  });
  it("commence par l'installation quand le logement est confirmé, sans étape « avant la signature »", () => {
    expect(sectionOrder("confirmed")[0]).toBe("install");
    expect(phasesForStatus("confirmed")).toEqual(["beforeDeparture", "arrival"]);
    expect(checklistIds("confirmed").some((id) => id.startsWith("safety:"))).toBe(false);
  });
  it("met la comparaison en premier quand des logements sont repérés", () => {
    expect(sectionOrder("shortlist")[0]).toBe("compare");
  });
  it("compte la progression uniquement sur les étapes de la situation choisie", () => {
    expect(housingProgress("starting", []).total).toBe(22);
    expect(housingProgress("confirmed", ["safety:owner", "install:arrival:inventory"])).toEqual({ done: 1, total: 9 });
  });
});

describe("assistant logement — coûts", () => {
  it("ajoute les charges seulement si elles ne sont pas incluses", () => {
    expect(monthlyCost(home)).toBe(550);
    expect(monthlyCost({ ...home, charges_included: true })).toBe(500);
  });
  it("coût de départ = premier mois + caution + frais", () => {
    expect(upfrontCost(home)).toBe(1750);
  });
  it("arrondit la durée au mois supérieur", () => {
    expect(stayMonths("135")).toBe(5);
    expect(stayMonths("")).toBeNull();
  });
});

describe("assistant logement — lien avec le budget", () => {
  const cats = [{ key: "accommodation", planned: 3000 }, { key: "fees", planned: 300 }, { key: "food", planned: 900 }];
  it("remplace la ligne logement et range la caution dans les frais", () => {
    const plan = housingBudgetPlan(home, 5);
    expect(plan.accommodation).toBe(550 * 5 + 200);
    const out = applyHousingToBudget(cats, plan, null);
    expect(out.find((c) => c.key === "accommodation")!.planned).toBe(2950);
    expect(out.find((c) => c.key === "fees")!.planned).toBe(1300);
    expect(out.find((c) => c.key === "food")!.planned).toBe(900);
  });
  it("ne compte jamais deux fois la caution quand on refait l'opération", () => {
    const plan = housingBudgetPlan(home, 5);
    const once = applyHousingToBudget(cats, plan, null);
    const twice = applyHousingToBudget(once, plan, { optionId: "a", accommodation: plan.accommodation, deposit: plan.deposit });
    expect(twice).toEqual(once);
  });
});

describe("assistant logement — ressources", () => {
  it("n'affiche que des liens https écrits à la main", () => {
    expect(HOUSING_RESOURCES.every((r) => r.url.startsWith("https://"))).toBe(true);
  });
  it("ne propose aucune ressource pour un pays non couvert", () => {
    const r = resourcesForCountry("JP");
    expect(r.local.length + r.european.length).toBe(0);
  });
  it("propose les ressources locales et européennes pour l'Espagne", () => {
    const r = resourcesForCountry("ES");
    expect(r.local.map((x) => x.id)).toContain("badi");
    expect(r.european.length).toBeGreaterThan(0);
  });
});

describe("tableau de bord — 5 outils", () => {
  it("la progression globale compte le logement comme cinquième outil", () => {
    localStorage.clear();
    localStorage.setItem("xplania-prep::housing::madrid", JSON.stringify({ done: 9, total: 9 }));
    const p = readTripProgress({ destination: "Madrid" });
    expect(Object.keys(p)).toHaveLength(5);
    expect(overallPercent(p)).toBe(20);
  });
});
