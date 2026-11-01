import { describe, expect, it } from "vitest";
import { keepPreviousSummary } from "./official-summary";

const old = { status: "verified", fetchedAt: "2026-10-28T10:00:00Z", content: { a: 1 } };

describe("keepPreviousSummary", () => {
  it("keeps the summary on screen when the new check returns none", () => {
    const failed = { status: "unavailable", fetchedAt: "2026-11-01T10:00:00Z", content: null };
    expect(keepPreviousSummary(old, failed)).toBe(old);
  });

  it("shows the new summary when the check returns one", () => {
    const fresh = { status: "verified", fetchedAt: "2026-11-01T10:00:00Z", content: { a: 2 } };
    expect(keepPreviousSummary(old, fresh)).toBe(fresh);
  });

  it("shows the failure when nothing was on screen before", () => {
    const failed = { status: "unavailable", fetchedAt: "2026-11-01T10:00:00Z", content: null };
    expect(keepPreviousSummary(undefined, failed)).toBe(failed);
  });
});
