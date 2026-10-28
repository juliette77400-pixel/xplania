import { describe, expect, it } from "vitest";
import { normalizePromo } from "@/lib/promo-code";

describe("code promo bêta", () => {
  it("« estice » tapé en minuscules avec des espaces devient le code ESTICE", () => {
    expect(normalizePromo("  estice ")).toBe("ESTICE");
  });
});
