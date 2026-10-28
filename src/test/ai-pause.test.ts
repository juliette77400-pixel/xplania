import { describe, expect, it, vi } from "vitest";
import { AiHttpError, aiErrorResponse } from "../../supabase/functions/_shared/ai-json.ts";
import { isAiCreditBlock } from "../../supabase/functions/_shared/ai-unavailable.ts";
import { isAiPause, markAiPause } from "@/lib/ai-pause";

const cors = { "Access-Control-Allow-Origin": "*" };
const httpError = (status: number, body: unknown) => ({ name: "FunctionsHttpError", message: "non-2xx", context: new Response(JSON.stringify(body), { status }) });

describe("AI credits run out (workspace), not the student's tries", () => {
  it("a gateway 402 becomes a 503 ai_unavailable, never a 402", async () => {
    const res = aiErrorResponse(new AiHttpError(402, "no credits"), cors)!;
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "ai_unavailable" });
  });

  it("a 403 workspace credit limit is treated the same way", () => {
    expect(isAiCreditBlock(403, '{"type":"credit_limit_reached"}')).toBe(true);
    expect(aiErrorResponse(new AiHttpError(403, "x", '{"type":"credit_limit_reached"}'), cors)!.status).toBe(503);
  });

  it("other 403 refusals keep their status", () => {
    expect(aiErrorResponse(new AiHttpError(403, "denied", "provider denied"), cors)!.status).toBe(403);
  });

  it("the app tags the pause and shows the notice once per answer", async () => {
    const notify = vi.fn();
    const r = await markAiPause({ data: null, error: httpError(503, { error: "ai_unavailable", code: "ai_unavailable" }) }, notify);
    expect(isAiPause(r.error)).toBe(true);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("a student's own quota (402) is not mistaken for an AI pause", async () => {
    const notify = vi.fn();
    const r = await markAiPause({ data: null, error: httpError(402, { error: "quota_exceeded" }) }, notify);
    expect(isAiPause(r.error)).toBe(false);
    expect(notify).not.toHaveBeenCalled();
  });

  it("a function start-up failure (503 BOOT_ERROR) is not an AI pause", async () => {
    const notify = vi.fn();
    const r = await markAiPause({ data: null, error: httpError(503, { code: "BOOT_ERROR" }) }, notify);
    expect(isAiPause(r.error)).toBe(false);
    expect(notify).not.toHaveBeenCalled();
  });
});
