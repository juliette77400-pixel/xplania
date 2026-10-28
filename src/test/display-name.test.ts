import { describe, it, expect } from "vitest";
import { validateDisplayName, pickFirstName, DISPLAY_NAME_MAX } from "@/lib/display-name";

describe("validateDisplayName", () => {
  it("refuses an empty name", () => {
    expect(validateDisplayName("   ")).toEqual({ ok: false, error: "empty" });
  });
  it("refuses a name longer than 40 characters", () => {
    expect(DISPLAY_NAME_MAX).toBe(40);
    expect(validateDisplayName("a".repeat(41))).toEqual({ ok: false, error: "tooLong" });
  });
  it("refuses angle brackets", () => {
    expect(validateDisplayName("<b>Juliette</b>")).toEqual({ ok: false, error: "invalid" });
  });
  it("trims and collapses spaces", () => {
    expect(validateDisplayName("  Juliette   Noël ")).toEqual({ ok: true, value: "Juliette Noël" });
  });
});

describe("pickFirstName", () => {
  it("prefers the saved profile name over the sign-in name", () => {
    expect(pickFirstName("Lou Martin", { full_name: "Louise Martin" }, "x@y.fr")).toBe("Lou");
  });
  it("falls back to the e-mail when nothing else is known", () => {
    expect(pickFirstName(null, {}, "marie.dupont@ex.fr")).toBe("Marie");
  });
});
