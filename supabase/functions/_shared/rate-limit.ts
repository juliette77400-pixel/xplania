// Ad-hoc in-memory rate limiter for edge functions.
//
// Caveats (explicit tradeoff — no distributed store yet):
// - State is per-isolate. Supabase spins up multiple isolates under load, so
//   the real global rate is `limit * isolateCount`. Treat this as best-effort
//   abuse mitigation, NOT a strict quota.
// - State is lost on cold start. Attackers hitting a fresh isolate get their
//   full budget again.
// - Not suitable for billing enforcement. Use for coarse cost/abuse control.
//
// If you need strict, cross-isolate quotas, back this with Redis or a
// Postgres table (see `gam_notification_log` for a similar rolling-log
// pattern).

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Unique identifier for this limiter (usually the function name). */
  key: string;
  /** Caller identity — user id from requireAuth, or IP as fallback. */
  subject: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${opts.key}:${opts.subject}`;
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + opts.windowMs };
    buckets.set(bucketKey, fresh);
    return { allowed: true, remaining: opts.limit - 1, resetAt: fresh.resetAt };
  }

  if (bucket.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: opts.limit - bucket.count, resetAt: bucket.resetAt };
}

/** Convenience: return a 429 Response if the limit is exceeded, else null. */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
): Response | null {
  if (result.allowed) return null;
  const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: "rate_limit_exceeded",
      retry_after_seconds: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
