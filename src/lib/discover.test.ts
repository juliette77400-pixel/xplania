import { describe, it, expect, afterEach, vi } from "vitest";
import { categoryByKey, distanceKm, timeOfDay, CATEGORIES } from "./discover";

describe("categoryByKey", () => {
  it("finds a known category by its key", () => {
    expect(categoryByKey("food")).toBe(CATEGORIES[0]);
    expect(categoryByKey("food")?.label).toBe("Food & Drinks");
  });

  it("returns undefined for an unknown key", () => {
    expect(categoryByKey("does-not-exist")).toBeUndefined();
  });
});

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 48.8566, lng: 2.3522 }, { lat: 48.8566, lng: 2.3522 })).toBeCloseTo(0, 5);
  });

  it("approximates the Paris–London great-circle distance (~343 km)", () => {
    const d = distanceKm({ lat: 48.8566, lng: 2.3522 }, { lat: 51.5074, lng: -0.1278 });
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(355);
  });

  it("is symmetric", () => {
    const a = { lat: 40.7128, lng: -74.006 };
    const b = { lat: 34.0522, lng: -118.2437 };
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 6);
  });
});

describe("timeOfDay", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const at = (hour: number) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, hour, 0, 0));
    return timeOfDay();
  };

  it("maps hours to the right slot", () => {
    expect(at(2)).toBe("night");
    expect(at(8)).toBe("morning");
    expect(at(14)).toBe("afternoon");
    expect(at(20)).toBe("evening");
    expect(at(23)).toBe("night");
  });

  it("uses inclusive lower boundaries", () => {
    expect(at(6)).toBe("morning");
    expect(at(12)).toBe("afternoon");
    expect(at(18)).toBe("evening");
  });
});
