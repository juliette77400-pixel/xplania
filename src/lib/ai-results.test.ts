import { describe, expect, it } from "vitest";
import { isOutdated, needsAiCall, pickNewest, type SavedAiResult } from "./ai-results";

const saved = (updatedAt: string, inputKey = "ES|30", locale: "fr" | "en" = "fr"): SavedAiResult<string> =>
  ({ content: updatedAt, inputKey, locale, updatedAt });

describe("needsAiCall", () => {
  it("never calls the AI on reopening when a result is saved", () => {
    expect(needsAiCall(saved("2026-11-01T10:00:00Z"), false)).toBe(false);
  });
  it("calls the AI for the very first result of a trip", () => {
    expect(needsAiCall(null, false)).toBe(true);
  });
  it("calls the AI when the student asks for new ideas", () => {
    expect(needsAiCall(saved("2026-11-01T10:00:00Z"), true)).toBe(true);
  });
});

describe("isOutdated", () => {
  it("is not outdated for the same trip facts and language", () => {
    expect(isOutdated(saved("x", "ES|30", "fr"), "ES|30", "fr")).toBe(false);
  });
  it("is outdated when the trip changed", () => {
    expect(isOutdated(saved("x", "ES|30", "fr"), "ES|60", "fr")).toBe(true);
  });
  it("is outdated (update offered, not automatic) when the language changed", () => {
    expect(isOutdated(saved("x", "ES|30", "fr"), "ES|30", "en")).toBe(true);
  });
});

describe("pickNewest", () => {
  it("prefers the account copy when it is newer (other device)", () => {
    const local = saved("2026-11-01T10:00:00Z");
    const remote = saved("2026-11-01T12:00:00Z");
    expect(pickNewest(local, remote)).toBe(remote);
  });
  it("keeps the device copy when it is newer", () => {
    const local = saved("2026-11-01T13:00:00Z");
    const remote = saved("2026-11-01T12:00:00Z");
    expect(pickNewest(local, remote)).toBe(local);
  });
  it("uses whichever copy exists", () => {
    const remote = saved("2026-11-01T12:00:00Z");
    expect(pickNewest(null, remote)).toBe(remote);
    expect(pickNewest(remote, null)).toBe(remote);
  });
});
