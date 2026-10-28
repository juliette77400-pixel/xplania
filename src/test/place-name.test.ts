import { describe, it, expect } from "vitest";
import { placeName } from "@/lib/country-match";

describe("placeName", () => {
  it("shows a French country name in English when the app is in English", () => {
    expect(placeName("Espagne", "en")).toBe("Spain");
  });
  it("keeps the saved name in French", () => {
    expect(placeName("Espagne", "fr")).toBe("Espagne");
  });
  it("leaves a city as typed", () => {
    expect(placeName("Lisbonne", "en")).toBe("Lisbonne");
  });
});
