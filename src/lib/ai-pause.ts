// When Xplania's AI credits run out, every backend function answers
// HTTP 503 + code "ai_unavailable" (see supabase/functions/_shared/ai-unavailable.ts).
// This is never the student's own tries: the try is given back, results already
// on screen stay, and one calm notice explains it instead of a generic error.
import i18n from "@/i18n";
import { toast } from "sonner";

export const AI_UNAVAILABLE = "ai_unavailable";
const FLAG = "__aiUnavailable";

type InvokeResult = { data: unknown; error: unknown };

/** Reads the error's response: true only for the "out of AI credits" answer. */
export async function detectAiPause(error: unknown): Promise<boolean> {
  const res = (error as { context?: unknown } | null)?.context as Response | undefined;
  if (!res || typeof res.clone !== "function" || res.status !== 503) return false;
  try {
    const body = await res.clone().json();
    return body?.code === AI_UNAVAILABLE;
  } catch {
    return false;
  }
}

/** Synchronous check, usable in any catch block once the invoke result went through markAiPause. */
export function isAiPause(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as Record<string, unknown>)[FLAG] === true || (error as Error).message === AI_UNAVAILABLE;
}

export function notifyAiPause() {
  // Same id: many tools failing at once show a single notice.
  toast.info(i18n.t("aiPause.title"), { id: "ai-pause", description: i18n.t("aiPause.message"), duration: 10000 });
}

/** Tags the error so components can tell it apart, and shows the notice once. */
export async function markAiPause<T extends InvokeResult>(result: T, notify: () => void = notifyAiPause): Promise<T> {
  if (result.error && typeof result.error === "object" && (await detectAiPause(result.error))) {
    (result.error as Record<string, unknown>)[FLAG] = true;
    notify();
  }
  return result;
}
