// Shared server-side quota guard for edge functions.
//
// Every AI-consuming edge function should call `enforceQuota(tool, req)` right
// after `requireAuth()`. When the caller's monthly quota for that tool has
// been reached, the guard returns a `402 Payment Required` response and the
// edge function returns early — the AI provider is never invoked. Admins
// (checked server-side in `consume_quota`) always pass.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export type QuotaTool =
  | "valise"
  | "budget"
  | "visa"
  | "discover"
  | "mood"
  | "explore"
  | "carnet"
  | "suivi";

/**
 * Increments the caller's counter atomically and returns a `Response` when
 * the request should be blocked (quota exhausted or unauthenticated). When it
 * returns `null`, the caller may proceed with the actual work.
 */
export async function enforceQuota(
  tool: QuotaTool,
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data, error } = await client.rpc("consume_quota", { _tool: tool });
    if (error) {
      console.error("[quota-guard] consume_quota rpc failed", error);
      // Fail-open on RPC infrastructure errors so a bad DB call doesn't
      // block paying users; log for follow-up. Fraud is still bounded by
      // the client-side counter as a soft cap.
      return null;
    }
    const payload = (data ?? {}) as {
      allowed?: boolean;
      admin?: boolean;
      reason?: string;
      used?: number;
      limit?: number;
    };
    if (payload.allowed) {
      if (!payload.admin) {
        const { data: u } = await client.auth.getUser();
        if (u?.user?.id) consumed.set(req, { tool, userId: u.user.id });
      }
      return null;
    }
    return new Response(
      JSON.stringify({
        error: "quota_exceeded",
        reason: payload.reason ?? "quota_exceeded",
        used: payload.used ?? 0,
        limit: payload.limit ?? 0,
        tool,
      }),
      {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[quota-guard] unexpected error", err);
    return null;
  }
}

// Tracks requests that consumed a quota unit so failures can be refunded.
const consumed = new WeakMap<Request, { tool: QuotaTool; userId: string }>();

async function refund(req: Request) {
  const c = consumed.get(req);
  if (!c) return;
  consumed.delete(req);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await admin.rpc("refund_quota", { _user: c.userId, _tool: c.tool });
    if (error) console.error("[quota-guard] refund failed", error);
  } catch (err) {
    console.error("[quota-guard] refund error", err);
  }
}

/** Wraps a handler: if the request consumed a quota unit and then failed
 * (error status or thrown error), the unit is given back to the user. */
export function withQuotaRefund(handler: (req: Request) => Response | Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      const res = await handler(req);
      if (res.status >= 400) await refund(req);
      return res;
    } catch (err) {
      await refund(req);
      throw err;
    }
  };
}
