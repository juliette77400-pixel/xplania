/** Terminal provider failures must never be replayed from a retry button or offline queue. */
export function terminalAiFailure(error: unknown): boolean {
  const e = error as { context?: { status?: number }; status?: number; message?: string; __aiUnavailable?: boolean } | null;
  const status = e?.context?.status ?? e?.status;
  return e?.__aiUnavailable === true || e?.message === "ai_unavailable" || e?.message === "no_answer"
    || e?.message === "ai_refused" || e?.message === "ai_denied"
    || (typeof status === "number" && status >= 400 && status < 500 && status !== 429);
}