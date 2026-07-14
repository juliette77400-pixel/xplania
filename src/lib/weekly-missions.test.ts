import { describe, it, expect } from "vitest";
import { getCurrentWeekKey, getNextMonday, formatTimeLeft } from "./weekly-missions";

describe("getCurrentWeekKey", () => {
  it("returns an ISO week key in YYYY-Www format", () => {
    expect(getCurrentWeekKey(new Date(2026, 0, 5))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("puts Thursday Jan 1 2026 in ISO week 01", () => {
    expect(getCurrentWeekKey(new Date(2026, 0, 1))).toBe("2026-W01");
  });

  it("puts Monday Jan 5 2026 in ISO week 02", () => {
    expect(getCurrentWeekKey(new Date(2026, 0, 5))).toBe("2026-W02");
  });
});

describe("getNextMonday", () => {
  it("returns the following Monday at midnight for a mid-week date", () => {
    const nm = getNextMonday(new Date(2026, 0, 7, 15, 30)); // Wed Jan 7
    expect(nm.getDay()).toBe(1);
    expect(nm.getDate()).toBe(12);
    expect(nm.getHours()).toBe(0);
    expect(nm.getMinutes()).toBe(0);
  });

  it("returns the next day when called on a Sunday", () => {
    const nm = getNextMonday(new Date(2026, 0, 4, 9, 0)); // Sun Jan 4
    expect(nm.getDay()).toBe(1);
    expect(nm.getDate()).toBe(5);
  });
});

describe("formatTimeLeft", () => {
  it("formats days and hours when more than a day remains", () => {
    // Wed Jan 7 10:00 → next Monday Jan 12 00:00 = 4 days 14 hours
    expect(formatTimeLeft(new Date(2026, 0, 7, 10, 0))).toBe("4j 14h");
  });

  it("formats hours and minutes when less than a day remains", () => {
    // Sun Jan 11 22:00 → next Monday Jan 12 00:00 = 2 hours
    expect(formatTimeLeft(new Date(2026, 0, 11, 22, 0))).toBe("2h 0m");
  });
});
