import { describe, it, expect } from "vitest";
import { computeXp, getLevelProgress, LEVELS } from "./xp-levels";

const ZERO = {
  exploreVisited: 0,
  journalNotes: 0,
  journalPhotos: 0,
  journalLocations: 0,
  journalMoods: 0,
  moodFavorites: 0,
  moodHiddenGems: 0,
  badgesTotal: 0,
};

describe("computeXp", () => {
  it("returns 0 for no activity", () => {
    expect(computeXp(ZERO)).toBe(0);
  });

  it("weights each activity by its point value", () => {
    expect(computeXp({ ...ZERO, exploreVisited: 5 })).toBe(100); // 5 * 20
    expect(computeXp({ ...ZERO, journalNotes: 3 })).toBe(30); // 3 * 10
    expect(computeXp({ ...ZERO, journalPhotos: 2 })).toBe(30); // 2 * 15
    expect(computeXp({ ...ZERO, moodHiddenGems: 1 })).toBe(25);
    expect(computeXp({ ...ZERO, badgesTotal: 1 })).toBe(50);
  });

  it("treats optional contribution inputs as 0 when omitted", () => {
    expect(computeXp({ ...ZERO, badgesTotal: 2 })).toBe(100);
  });

  it("counts optional placeReviews and moodReactions when provided", () => {
    expect(computeXp({ ...ZERO, placeReviews: 2, moodReactions: 3 })).toBe(2 * 25 + 3 * 12);
  });

  it("sums a mixed activity profile", () => {
    const total = computeXp({
      exploreVisited: 2, // 40
      journalNotes: 3, // 30
      journalPhotos: 1, // 15
      journalLocations: 1, // 12
      journalMoods: 2, // 30
      moodFavorites: 1, // 10
      moodHiddenGems: 1, // 25
      badgesTotal: 1, // 50
      placeReviews: 2, // 50
      moodReactions: 1, // 12
    });
    expect(total).toBe(274);
  });
});

describe("getLevelProgress", () => {
  it("starts at the first level with 0 XP", () => {
    const p = getLevelProgress(0);
    expect(p.level).toBe(LEVELS[0]);
    expect(p.next).toBe(LEVELS[1]);
    expect(p.pct).toBe(0);
    expect(p.xpForNext).toBe(LEVELS[1].minXp);
  });

  it("computes mid-level progress percentage", () => {
    const p = getLevelProgress(100); // half-way to 200
    expect(p.level.index).toBe(0);
    expect(p.xpInLevel).toBe(100);
    expect(p.pct).toBe(50);
    expect(p.xpForNext).toBe(100);
  });

  it("advances to the next level exactly at its threshold", () => {
    const p = getLevelProgress(200);
    expect(p.level.index).toBe(1);
    expect(p.xpInLevel).toBe(0);
  });

  it("clamps negative XP to the first level", () => {
    const p = getLevelProgress(-500);
    expect(p.level.index).toBe(0);
    expect(p.xp).toBe(0);
  });

  it("caps at the last level with no next and 100%", () => {
    const p = getLevelProgress(999999);
    const last = LEVELS[LEVELS.length - 1];
    expect(p.level).toBe(last);
    expect(p.next).toBeNull();
    expect(p.pct).toBe(100);
    expect(p.xpForNext).toBe(0);
  });
});
