import { describe, expect, it } from "vitest";
import { decideBudgetSync } from "./budget-state";

const made = (savedAt: number) => ({ hasGenerated: true, savedAt, categories: [] });

describe("budget saved in the account, per trip", () => {
  it("a new device gets the budget saved on another device", () => {
    expect(decideBudgetSync(null, made(100))).toEqual({ use: "remote", push: false });
  });
  it("a budget that only exists on this device is sent to the account (existing data kept)", () => {
    expect(decideBudgetSync(made(100), null)).toEqual({ use: "local", push: true });
  });
  it("the most recent manual change wins: account newer", () => {
    expect(decideBudgetSync(made(100), made(200)).use).toBe("remote");
  });
  it("the most recent manual change wins: device newer, and it is sent", () => {
    expect(decideBudgetSync(made(300), made(200))).toEqual({ use: "local", push: true });
  });
  it("an empty copy (budget never created) never replaces a real one", () => {
    expect(decideBudgetSync(made(100), { hasGenerated: false, savedAt: 999 })).toEqual({ use: "local", push: true });
  });
});
