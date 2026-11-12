import { describe, expect, it } from "vitest";
import { readResponseStream } from "../../supabase/functions/_shared/response-stream";

function stream(events: unknown[], split = false) {
  const data = events.map((e) => `data: ${JSON.stringify(e)}\r\n\r\n`).join("");
  return new ReadableStream<Uint8Array>({ start(controller) {
    const bytes = new TextEncoder().encode(data);
    if (split) for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    else controller.enqueue(bytes);
    controller.close();
  } });
}
describe("prepared Responses stream handling (no live AI)", () => {
  it("consumes metadata and split UTF-8 before visible output", async () => {
    const answer = await readResponseStream(stream([{ type: "response.created" }, { type: "response.output_text.delta", delta: "Réponse complète" }, { type: "response.completed" }], true));
    expect(answer).toBe("Réponse complète");
  });
  it("reads final message output when there were no deltas", async () => {
    expect(await readResponseStream(stream([{ type: "response.completed", response: { output: [{ content: [{ type: "output_text", text: "saved" }] }] } }]))).toBe("saved");
  });
  it("never accepts a partial stream as a usable answer", async () => {
    await expect(readResponseStream(stream([{ type: "response.output_text.delta", delta: "partial" }]))).rejects.toMatchObject({ code: "stream_incomplete" });
  });
  it("fails a stream with empty successful output", async () => {
    await expect(readResponseStream(stream([{ type: "response.completed" }]))).rejects.toMatchObject({ code: "empty_output" });
  });
  it("ends on a refusal even with HTTP success", async () => {
    await expect(readResponseStream(stream([{ type: "response.refusal.done", refusal: "Safe refusal" }]))).rejects.toMatchObject({ code: "ai_refused", message: "Safe refusal" });
  });
  it("preserves terminal access denial after headers", async () => {
    await expect(readResponseStream(stream([{ type: "response.failed", response: { error: { status: 403, message: "Access denied" } } }]))).rejects.toMatchObject({ code: "ai_denied", status: 403 });
  });
  it("discards partial output on an incomplete event", async () => {
    await expect(readResponseStream(stream([{ type: "response.output_text.delta", delta: "partial" }, { type: "response.incomplete" }]))).rejects.toMatchObject({ code: "stream_incomplete" });
  });
});