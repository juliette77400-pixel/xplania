import { describe, expect, it } from "vitest";
import { applyScoreTags, calculateBadge, emptyScores } from "./traveler-badge";

describe("calculateBadge", () => {
  it("falls back to curious when all scores are 0", () => {
    expect(calculateBadge(emptyScores()).key).toBe("curious");
  });

  it("matches a combo when top1+top2 are both in a combo", () => {
    const scores = { ...emptyScores(), culture: 8, authenticity: 6, nature: 1 };
    expect(calculateBadge(scores).key).toBe("cultural_explorer");
  });

  it("falls back to the top1 single mapping when no combo matches", () => {
    const scores = { ...emptyScores(), food: 6, budget: 3 };
    expect(calculateBadge(scores).key).toBe("gastronomic");
  });

  it("maps nomad+organization to digital_nomad", () => {
    const scores = { ...emptyScores(), nomad: 5, organization: 4 };
    expect(calculateBadge(scores).key).toBe("digital_nomad");
  });

  it("returns two feature recommendations", () => {
    const { features } = calculateBadge({ ...emptyScores(), adventure: 4, nature: 3 });
    expect(features).toHaveLength(2);
  });
});

describe("applyScoreTags", () => {
  it("adds tags on right swipe", () => {
    const next = applyScoreTags(emptyScores(), { culture: 2, authenticity: 1 }, "right");
    expect(next.culture).toBe(2);
    expect(next.authenticity).toBe(1);
  });
  it("subtracts tags on left swipe", () => {
    const next = applyScoreTags({ ...emptyScores(), culture: 3 }, { culture: 2 }, "left");
    expect(next.culture).toBe(1);
  });
  it("does nothing on skip", () => {
    const next = applyScoreTags(emptyScores(), { culture: 2 }, "skip");
    expect(next.culture).toBe(0);
  });
});
