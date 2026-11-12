/** Pure SSE consumer prepared for the existing Responses helpers; no provider calls or timers. */
export class ResponseStreamError extends Error {
  constructor(public code: "ai_refused" | "ai_denied" | "stream_failed" | "stream_incomplete" | "empty_output", message: string, public status = 502) {
    super(message);
  }
}

type Event = {
  type?: string; delta?: string; refusal?: string;
  error?: { message?: string; code?: string; status?: number };
  response?: { status?: string; error?: { message?: string; code?: string; status?: number }; output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }> };
};

export async function readResponseStream(body: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!body) throw new ResponseStreamError("empty_output", "The AI service returned no response.");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let completed = false;
  const consume = (frame: string) => {
    const payload = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n").trim();
    if (!payload || payload === "[DONE]") return;
    let event: Event;
    try { event = JSON.parse(payload) as Event; }
    catch { throw new ResponseStreamError("stream_incomplete", "The AI response could not be read."); }
    if (event.type?.includes("refusal")) throw new ResponseStreamError("ai_refused", event.refusal || event.delta || "The AI service declined this request.", 422);
    if (event.type === "error" || event.type === "response.failed" || event.response?.status === "failed") {
      const error = event.error ?? event.response?.error;
      const denied = error?.status === 403 || /denied|access_denied|permission_denied/.test(error?.code ?? "");
      throw new ResponseStreamError(denied ? "ai_denied" : "stream_failed", error?.message || "The AI service could not complete this request.", denied ? 403 : error?.status ?? 502);
    }
    if (event.type === "response.incomplete" || event.response?.status === "incomplete") throw new ResponseStreamError("stream_incomplete", "The AI response was interrupted.");
    if (event.type === "response.output_text.delta") text += event.delta ?? "";
    if (event.type === "response.completed") {
      const parts = event.response?.output?.flatMap((item) => item.content ?? []) ?? [];
      const refusal = parts.find((part) => part.type === "refusal");
      if (refusal) throw new ResponseStreamError("ai_refused", refusal.refusal || "The AI service declined this request.", 422);
      if (!text) text = event.response?.output_text || parts.filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("");
      completed = true;
    }
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      // Normalize CRLF only after a full chunk has been appended (a CRLF may span chunks).
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        consume(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!completed) throw new ResponseStreamError("stream_incomplete", "The AI response ended before completion.");
    if (!text.trim()) throw new ResponseStreamError("empty_output", "The AI service returned no usable answer.");
    return text.trim();
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}