import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLongWait } from "./useLongWait";
describe("informational AI wait", () => {
  afterEach(() => vi.useRealTimers());
  it("signals a long wait without ending pending work and resets on completion", () => {
    vi.useFakeTimers();
    const hook = renderHook(({ pending }) => useLongWait(pending), { initialProps: { pending: true } });
    expect(hook.result.current).toBe(false);
    act(() => vi.advanceTimersByTime(15_000));
    expect(hook.result.current).toBe(true);
    act(() => vi.advanceTimersByTime(60_000));
    expect(hook.result.current).toBe(true);
    hook.rerender({ pending: false });
    expect(hook.result.current).toBe(false);
  });
});