// Classifies one HTTP check of an external link. Pure (no Deno APIs) so it is unit-tested.
export type LinkOutcome = "ok" | "moved" | "broken" | "blocked" | "error";

const hostOf = (u: string) => {
  try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

/**
 * - ok: page answered 2xx on the same site (redirects inside the same site are fine);
 * - moved: page answered 2xx but on another site → the link may be obsolete;
 * - broken: 404 / 410 → the page no longer exists;
 * - blocked: the site refused the robot (401/403/429/451/503…) → not proven reachable;
 * - error: network error, timeout or server error.
 * Only "ok" counts as a successful check.
 */
export function classifyLink(url: string, status: number | null, finalUrl: string | null): LinkOutcome {
  if (status === null) return "error";
  if (status >= 200 && status < 400) {
    const a = hostOf(url);
    const b = hostOf(finalUrl || url);
    return a && b && a !== b && !b.endsWith(`.${a}`) && !a.endsWith(`.${b}`) ? "moved" : "ok";
  }
  if (status === 404 || status === 410) return "broken";
  if ([401, 403, 405, 406, 429, 451, 503].includes(status)) return "blocked";
  return "error";
}
