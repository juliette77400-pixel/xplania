import { describe, it, expect } from "vitest";
import { buildDateRange } from "./journal-utils";

describe("buildDateRange", () => {
  it("returns an empty range without a start date", () => {
    expect(buildDateRange()).toEqual([]);
    expect(buildDateRange(null)).toEqual([]);
  });

  it("returns a single day when no end date is given", () => {
    expect(buildDateRange("2026-01-01")).toEqual(["2026-01-01"]);
  });

  it("returns an inclusive range from start to end", () => {
    expect(buildDateRange("2026-01-01", "2026-01-03")).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });

  it("handles a start equal to end as one day", () => {
    expect(buildDateRange("2026-06-15", "2026-06-15")).toEqual(["2026-06-15"]);
  });

  it("clamps to at least one day when end precedes start", () => {
    expect(buildDateRange("2026-01-05", "2026-01-01")).toEqual(["2026-01-05"]);
  });

  it("spans across a month boundary", () => {
    expect(buildDateRange("2026-01-30", "2026-02-02")).toEqual([
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
  });
});
