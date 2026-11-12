import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadAiResult, saveAiResult } from "./trip-ai-results";

const mock = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn(), session: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getSession: mock.session },
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mock.read }) }) }), upsert: mock.write }),
} }));
describe("account read failures never mean no saved analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks(); localStorage.clear();
    mock.session.mockResolvedValue({ data: { session: { user: { id: "student" } } } });
    mock.write.mockResolvedValue({ error: null });
  });
  it("rejects a missing local copy when the remote read fails in strict mode", async () => {
    mock.read.mockResolvedValue({ data: null, error: new Error("offline") });
    await expect(loadAiResult("trip", "trip", "budget_insights", { requireRemote: true })).rejects.toThrow("offline");
  });
  it("still serves a local result without writing over the unread account copy", async () => {
    saveAiResult("trip", null, "budget_insights", { tips: ["saved"] }, "ES", "fr");
    mock.read.mockResolvedValue({ data: null, error: new Error("offline") });
    const result = await loadAiResult("trip", "trip", "budget_insights", { requireRemote: true });
    expect(result?.content).toEqual({ tips: ["saved"] });
    expect(mock.write).not.toHaveBeenCalled();
  });
  it("returns null only after a successful absent remote result", async () => {
    mock.read.mockResolvedValue({ data: null, error: null });
    expect(await loadAiResult("trip", "trip", "budget_insights", { requireRemote: true })).toBe(null);
  });
});