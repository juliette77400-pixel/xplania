// Backend functions that have been idle can fail to start when several
// students call them at the same second (503 BOOT_ERROR). The function never
// ran (no AI call, no try used), so the call is simply retried a few times.
import { supabase } from "@/integrations/supabase/client";
import { markAiPause } from "@/lib/ai-pause";

export const BOOT_RETRY_DELAYS_MS = [1200, 2500, 4000];

type InvokeResult = { data: unknown; error: unknown };

/** True only for "function failed to start" — never for quota, auth or AI errors. */
export async function isBootError(error: unknown): Promise<boolean> {
  const res = (error as { context?: unknown } | null)?.context;
  if (!res || typeof (res as Response).clone !== "function" || (res as Response).status !== 503) return false;
  try {
    const body = await (res as Response).clone().json();
    return body?.code === "BOOT_ERROR";
  } catch {
    return false;
  }
}

export async function withBootRetry<T extends InvokeResult>(
  call: () => Promise<T>,
  delays: number[] = BOOT_RETRY_DELAYS_MS,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<T> {
  let result = await call();
  for (const ms of delays) {
    if (!result.error || !(await isBootError(result.error))) break;
    await sleep(ms + Math.floor(Math.random() * 600));
    result = await call();
  }
  return result;
}

let installed = false;

/** Makes every supabase.functions.invoke() retry start-up failures. */
export function installInvokeRetry() {
  if (installed) return;
  installed = true;
  // `supabase.functions` builds a new client on each access, so patch the shared prototype.
  const proto = Object.getPrototypeOf(supabase.functions) as { invoke: (...args: unknown[]) => Promise<InvokeResult> };
  const original = proto.invoke;
  proto.invoke = function (this: unknown, ...args: unknown[]) {
    // Out-of-AI-credits answers are tagged and explained once (src/lib/ai-pause.ts).
    return withBootRetry(() => original.apply(this, args)).then((r) => markAiPause(r));
  };
}
