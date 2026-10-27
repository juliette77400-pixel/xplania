import { describe, expect, it, vi } from "vitest";
import { isBootError, withBootRetry } from "./invoke-retry";

const err = (status: number, body: unknown) => ({ context: new Response(JSON.stringify(body), { status }) });
const noSleep = () => Promise.resolve();

describe("nouvelle tentative quand un outil ne démarre pas", () => {
  it("reconnaît seulement l'erreur de démarrage", async () => {
    expect(await isBootError(err(503, { code: "BOOT_ERROR" }))).toBe(true);
    expect(await isBootError(err(402, { error: "quota_exceeded" }))).toBe(false);
    expect(await isBootError(err(503, { error: "other" }))).toBe(false);
  });

  it("réessaie après un échec de démarrage et rend la bonne réponse", async () => {
    const call = vi.fn()
      .mockResolvedValueOnce({ data: null, error: err(503, { code: "BOOT_ERROR" }) })
      .mockResolvedValueOnce({ data: { ok: 1 }, error: null });
    const res = await withBootRetry(call, [1, 1, 1], noSleep);
    expect(call).toHaveBeenCalledTimes(2);
    expect(res.data).toEqual({ ok: 1 });
  });

  it("ne réessaie jamais quand les essais du mois sont épuisés", async () => {
    const call = vi.fn().mockResolvedValue({ data: null, error: err(402, { error: "quota_exceeded" }) });
    await withBootRetry(call, [1, 1, 1], noSleep);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("s'arrête après 3 nouvelles tentatives", async () => {
    const call = vi.fn().mockImplementation(async () => ({ data: null, error: err(503, { code: "BOOT_ERROR" }) }));
    await withBootRetry(call, [1, 1, 1], noSleep);
    expect(call).toHaveBeenCalledTimes(4);
  });
});
