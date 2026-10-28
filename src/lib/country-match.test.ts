import { describe, it, expect } from "vitest";
import { findCountry } from "./country-match";
import { getCityProfile } from "./cost-of-living";

describe("findCountry", () => {
  it("recognises the countries added in October 2026 typed in French or English", () => {
    expect(findCountry("Corée du Sud")).toBe("KR");
    expect(findCountry("South Korea")).toBe("KR");
    expect(findCountry("Sweden")).toBe("SE");
    expect(findCountry("Nouvelle-Zélande")).toBe("NZ");
    expect(findCountry("New Zealand")).toBe("NZ");
    expect(findCountry("Afrique du Sud")).toBe("ZA");
    expect(findCountry("Peru")).toBe("PE");
  });
});

describe("Budget price levels", () => {
  it("no longer prices the new countries like Paris", () => {
    expect(getCityProfile("Mumbai, Inde").currency).toBe("INR");
    expect(getCityProfile("Oslo, Norvège").currency).toBe("NOK");
    expect(getCityProfile("Porto Alegre, Brésil").currency).toBe("BRL");
    expect(getCityProfile("Porto, Portugal").currency).toBe("EUR");
    expect(getCityProfile("Jakarta, Indonésie").currency).toBe("IDR");
  });
});
