import { describe, it, expect } from "vitest";
import { localGenerationBlocked, localGenerationUsesTry } from "@/config/open-tools";

describe("Budget sans compte", () => {
  it("un visiteur peut générer son budget même sans compteur d'essais", () => {
    expect(localGenerationBlocked(false, true)).toBe(false);
  });
  it("un visiteur ne consomme aucun essai", () => {
    expect(localGenerationUsesTry(false)).toBe(false);
  });
  it("un étudiant connecté sans essai restant reste bloqué", () => {
    expect(localGenerationBlocked(true, true)).toBe(true);
    expect(localGenerationUsesTry(true)).toBe(true);
  });
});
