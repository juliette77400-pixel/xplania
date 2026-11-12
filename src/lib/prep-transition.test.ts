import { describe, expect, it } from "vitest";
import { claimPrepTransition } from "./prep-transition";

describe("questionnaire transitions", () => {
  it("claims one advance for two actions on the same step", () => {
    const lock = { current: null as number | null };
    expect(claimPrepTransition(lock, 2)).toBe(true);
    expect(claimPrepTransition(lock, 2)).toBe(false);
    expect(claimPrepTransition(lock, 3)).toBe(true);
  });
  it("allows a deliberate return or failed save to be retried", () => {
    const lock = { current: null as number | null };
    claimPrepTransition(lock, 6);
    lock.current = null;
    expect(claimPrepTransition(lock, 6)).toBe(true);
  });
});