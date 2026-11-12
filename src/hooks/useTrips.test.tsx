import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useTrips } from "./useTrips";

const mock = vi.hoisted(() => ({ read: vi.fn(), user: { id: "student" } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: mock.user }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ order: mock.read }) }) }) } }));

function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useTrips(), { wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
describe("trip reads", () => {
  beforeEach(() => vi.clearAllMocks());
  it("exposes a failed read, not a confirmed empty account", async () => {
    const failure = { message: "temporary outage" };
    mock.read.mockResolvedValue({ data: null, error: failure });
    const hook = open();
    await waitFor(() => expect(hook.result.current.error).toBe(failure));
    expect(hook.result.current.loading).toBe(false);
  });
  it("distinguishes a successful empty account", async () => {
    mock.read.mockResolvedValue({ data: [], error: null });
    const hook = open();
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.error).toBe(null);
    expect(hook.result.current.trips).toEqual([]);
  });
});