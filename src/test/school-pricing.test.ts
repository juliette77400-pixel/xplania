import { describe, expect, it } from "vitest";
import { SCHOOL_CYCLES, clampStudents, monthlyEquivalent, schoolTotal } from "@/lib/school-pricing";

describe("offre école : prix étudiant × nombre d'étudiants", () => {
  it("multiplie le prix d'un étudiant par le nombre d'étudiants", () => {
    expect(schoolTotal(5.99, 30)).toBe(179.7);
    expect(schoolTotal(39.9, 25)).toBe(997.5);
  });
  it("un seul étudiant paie le prix étudiant", () => {
    expect(schoolTotal(7.99, 1)).toBe(7.99);
  });
  it("le nombre d'étudiants est un entier d'au moins 1", () => {
    expect(clampStudents(0)).toBe(1);
    expect(clampStudents(12.7)).toBe(12);
    expect(clampStudents(Number.NaN)).toBe(1);
  });
  it("l'école choisit seulement Mensuel ou Annuel", () => {
    expect(SCHOOL_CYCLES).toEqual(["monthly", "yearly"]);
  });
  it("en annuel, le total reste le prix annuel étudiant × effectif, sans remise ajoutée", () => {
    expect(schoolTotal(59.9, 30)).toBe(1797);
    expect(monthlyEquivalent(59.9)).toBe(4.99);
  });
});
