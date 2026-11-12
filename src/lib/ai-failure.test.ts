import { describe, expect, it } from "vitest";
import { terminalAiFailure } from "./ai-failure";
describe("terminal AI failures", () => {
  it.each([400, 401, 402, 403, 404])("never replays status %s", (status) => {
    expect(terminalAiFailure({ context: { status } })).toBe(true);
  });
  it.each([429, 500, 503])("does not classify transient status %s as terminal", (status) => {
    expect(terminalAiFailure({ context: { status } })).toBe(false);
  });
  it("treats a refusal, empty answer and persisted credit pause as terminal", () => {
    expect(terminalAiFailure(new Error("ai_refused"))).toBe(true);
    expect(terminalAiFailure(new Error("no_answer"))).toBe(true);
    expect(terminalAiFailure({ __aiUnavailable: true })).toBe(true);
  });
});