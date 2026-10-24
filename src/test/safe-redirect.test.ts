import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

describe("redirection après connexion", () => {
  it("garde une page du site", () => {
    expect(safeNextPath("/guide-visa", "/app")).toBe("/guide-visa");
    expect(safeNextPath("/app?new=1", "/app")).toBe("/app?new=1");
  });
  it("refuse tout site extérieur", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "@evil.com", "javascript:alert(1)", "/\u0000x"]) {
      expect(safeNextPath(bad, "/app")).toBe("/app");
    }
  });
});
