import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useBudgetInsights } from "./useBudgetInsights";

const mock = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), invoke: vi.fn() }));
vi.mock("@/lib/data/trip-ai-results", () => ({ loadAiResult: mock.load, saveAiResult: mock.save }));
vi.mock("@/stores/useActiveTrip", () => ({ useActiveTrip: (pick: (s: { tripId: string }) => unknown) => pick({ tripId: "trip-student" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mock.invoke } } }));

function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return renderHook(() => useBudgetInsights({ enabled: true, destination: "Espagne", totalBudget: 500, days: 30, travelers: 1, locale: "fr", categories: [] }), {
    wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}
describe("Budget generation recovery", () => {
  beforeEach(() => { vi.clearAllMocks(); mock.load.mockResolvedValue(null); });
  it("does not regenerate when loading the saved account result fails", async () => {
    mock.load.mockRejectedValue(new Error("read outage"));
    const hook = open();
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(mock.invoke).not.toHaveBeenCalled();
  });
  it.each([429, 500, 403])("does not repeat a failed generation with status %s", async (status) => {
    mock.invoke.mockResolvedValue({ data: null, error: { context: new Response("{}", { status }) } });
    const hook = open();
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(mock.invoke).toHaveBeenCalledTimes(1);
  });
  it("does not regenerate after a save throws", async () => {
    mock.invoke.mockResolvedValue({ data: { scenarios: {}, tips: [], deals: {} }, error: null });
    mock.save.mockImplementation(() => { throw new Error("save failed"); });
    const hook = open();
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(mock.invoke).toHaveBeenCalledTimes(1);
  });
});