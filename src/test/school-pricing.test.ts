import { describe, expect, it } from "vitest";
import { clampStudents, schoolTotal } from "@/lib/school-pricing";

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
});
