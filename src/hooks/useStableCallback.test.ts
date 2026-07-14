import { describe, expect, it } from "vitest";
import { distanceMeters } from "@/hooks/useStableCallback";

describe("distanceMeters", () => {
  it("returns 0 for identical points", () => {
    expect(distanceMeters({ lat: 48.8566, lng: 2.3522 }, { lat: 48.8566, lng: 2.3522 })).toBe(0);
  });

  it("computes ~9.4 km between Paris and Versailles", () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const versailles = { lat: 48.8014, lng: 2.1301 };
    const d = distanceMeters(paris, versailles);
    // Real distance ~16.4 km along the great circle.
    expect(d).toBeGreaterThan(15_000);
    expect(d).toBeLessThan(18_000);
  });

  it("detects sub-meter movement", () => {
    const a = { lat: 48.8566, lng: 2.3522 };
    const b = { lat: 48.85660001, lng: 2.35220001 };
    expect(distanceMeters(a, b)).toBeLessThan(1);
  });

  it("is symmetric", () => {
    const a = { lat: 10, lng: 20 };
    const b = { lat: 30, lng: 40 };
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6);
  });
});
