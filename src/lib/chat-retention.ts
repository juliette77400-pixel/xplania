// Assistant conversations are kept 30 days after the last message: on the
// server by a daily clean-up, and on the device by these helpers, so a copy
// kept in the browser can never bring an expired conversation back.
export const CHAT_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** True when the last activity is older than the retention period (or unknown). */
export function isChatExpired(lastActivityMs: number | null | undefined, now = Date.now()): boolean {
  if (typeof lastActivityMs !== "number" || !Number.isFinite(lastActivityMs) || lastActivityMs <= 0) return true;
  return now - lastActivityMs > CHAT_RETENTION_DAYS * DAY_MS;
}

/** Keeps only the messages written during the retention period. */
export function keepRecentMessages<T extends { ts?: number }>(messages: T[], now = Date.now()): T[] {
  return messages.filter((m) => !isChatExpired(m?.ts, now));
}
