import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { randomGenerationDelay, useGenerationDelay } from "./useGenerationDelay";

vi.mock("sonner", () => ({ toast: { loading: vi.fn(() => "delay-toast"), dismiss: vi.fn() } }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("generation delay", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("stays within 0 to 10 seconds", () => {
    expect(randomGenerationDelay(() => 0)).toBe(0);
    expect(randomGenerationDelay(() => 0.5)).toBe(5_000);
    expect(randomGenerationDelay(() => 0.999999)).toBe(10_000);
  });

  it("ignores a second click while the delay is pending", async () => {
    vi.useFakeTimers();
    const hook = renderHook(() => useGenerationDelay());
    let first: Promise<boolean>;
    act(() => { first = hook.result.current.wait(); });
    await expect(hook.result.current.wait()).resolves.toBe(false);
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await expect(first!).resolves.toBe(true);
    hook.unmount();
  });

  it("cancels the delay when the page unmounts", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(1);
    const hook = renderHook(() => useGenerationDelay());
    let pending: Promise<boolean>;
    act(() => { pending = hook.result.current.wait(); });
    hook.unmount();
    await expect(pending!).resolves.toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
