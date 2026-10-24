import { describe, expect, it } from "vitest";
import {
  applyHousingToBudget, checklistIds, housingBudgetPlan, housingProgress, monthlyCost, nextStatus, phasesForStatus, safetyChecksApply, sectionOrder, stayMonths, upfrontCost,
} from "@/lib/housing";
import { resourcesForCountry, HOUSING_RESOURCES } from "@/data/housing-resources";
import { overallPercent, readTripProgress } from "@/lib/prep-progress";

const home = { monthly_rent: 500, charges_included: false, monthly_charges: 50, deposit: 1000, extra_fees: 200 };

describe("assistant logement — personnalisation", () => {
  it("débute ou perdu : ressources et premiers pas, sans étapes de signature ni d'arrivée", () => {
    for (const st of ["starting", "lost"] as const) {
      expect(sectionOrder(st)[0]).toBe("resources");
      expect(phasesForStatus(st)).toEqual(["gettingStarted"]);
      expect(safetyChecksApply(st)).toBe(false);
      expect(housingProgress(st, []).total).toBe(4);
    }
  });
  it("logements repérés : comparaison d'abord, 9 vérifications et étapes avant signature", () => {
    expect(sectionOrder("shortlist")[0]).toBe("compare");
    expect(phasesForStatus("shortlist")).toEqual(["beforeSigning"]);
    expect(safetyChecksApply("shortlist")).toBe(true);
    expect(housingProgress("shortlist", []).total).toBe(13);
  });
  it("logement confirmé : départ et arrivée seulement, plus de recherche de ressources", () => {
    expect(sectionOrder("confirmed")).toEqual(["install", "compare", "safety"]);
    expect(phasesForStatus("confirmed")).toEqual(["beforeDeparture", "arrival"]);
    expect(checklistIds("confirmed").some((id) => id.startsWith("safety:"))).toBe(false);
    expect(housingProgress("confirmed", ["safety:owner", "install:arrival:inventory"])).toEqual({ done: 1, total: 9 });
  });
  it("propose la situation suivante une fois les étapes faites", () => {
    expect(nextStatus("lost")).toBe("shortlist");
    expect(nextStatus("starting")).toBe("shortlist");
    expect(nextStatus("shortlist")).toBe("confirmed");
    expect(nextStatus("confirmed")).toBeNull();
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
