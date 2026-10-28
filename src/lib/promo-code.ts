// Beta promo code: checked and applied only by the server (redeem_promo_code). It gives unlimited
// AI tries until the code's end date, never the admin role or admin pages.
import { supabase } from "@/integrations/supabase/client";

export const PROMO_META_KEY = "promo_code";

export type RedeemResult = { ok: true; expiresAt: string } | { ok: false; reason: "invalid" | "expired" | "unauthenticated" | "error" };

/** Keeps the typed code tidy before sending it (the server compares in upper case). */
export function normalizePromo(raw: string): string {
  return raw.trim().toUpperCase().slice(0, 40);
}

export async function redeemPromoCode(code: string): Promise<RedeemResult> {
  const { data, error } = await supabase.rpc("redeem_promo_code", { _code: normalizePromo(code) });
  if (error || !data) return { ok: false, reason: "error" };
  const d = data as { ok: boolean; reason?: string; expires_at?: string };
  if (d.ok && d.expires_at) return { ok: true, expiresAt: d.expires_at };
  return { ok: false, reason: (["invalid", "expired", "unauthenticated"].includes(d.reason || "") ? d.reason : "error") as "invalid" };
}
