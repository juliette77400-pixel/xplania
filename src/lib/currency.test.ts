import { describe, it, expect } from "vitest";
import { guessCurrency, convert, SUPPORTED_CURRENCIES } from "./currency";

describe("guessCurrency", () => {
  it("defaults to EUR when no destination is given", () => {
    expect(guessCurrency()).toBe("EUR");
    expect(guessCurrency(null)).toBe("EUR");
    expect(guessCurrency("")).toBe("EUR");
  });

  it("maps well-known destinations to their currency (case-insensitive)", () => {
    expect(guessCurrency("Barcelone, Espagne")).toBe("EUR");
    expect(guessCurrency("TOKYO, JAPON")).toBe("JPY");
    expect(guessCurrency("New York, USA")).toBe("USD");
    expect(guessCurrency("Genève, Suisse")).toBe("CHF");
  });

  it("falls back to USD for an unrecognised destination", () => {
    expect(guessCurrency("Zanzibar")).toBe("USD");
  });

  it("only returns supported currency codes", () => {
    for (const dest of ["France", "Japon", "Canada", "Australie", "Zanzibar"]) {
      expect(SUPPORTED_CURRENCIES).toContain(guessCurrency(dest) as any);
    }
  });
});

describe("convert", () => {
  it("short-circuits to a 1:1 rate for identical currencies (no network)", async () => {
    const r = await convert(100, "EUR", "EUR");
    expect(r.rate).toBe(1);
    expect(r.result).toBe(100);
    expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
