// Centralized admin / unlimited access flag.
//
// The truth lives in the database (`public.user_roles` + `has_role`).
// The client caches the result in this module so any non-hook call site
// (Zustand stores, plain utilities like `usage-quota.ts`) can query the
// current status synchronously.
//
// The flag is set by <AdminGate /> after it fetches `is_current_user_admin`
// from Supabase. Manipulating it from the browser console does NOT grant
// any real privilege: every gated backend action still runs through RLS
// on the server, which only trusts `has_role(auth.uid(), 'admin')`.

let adminFlag = false;
// E2E hook: tests set `xplania:e2e_force_admin=1` in localStorage before load.
// This ONLY affects the client-side UI (paywall visibility, badge). Every
// server-side gate (RLS, consume_quota, can_retake_quiz) is unaffected —
// the test also has to stub the matching RPCs to fake an admin end-to-end.
if (typeof window !== "undefined") {
  try {
    if (window.localStorage.getItem("xplania:e2e_force_admin") === "1") {
      adminFlag = true;
    }
  } catch {
    /* noop */
  }
}
const listeners = new Set<(v: boolean) => void>();

export const setAdminFlag = (value: boolean) => {
  if (adminFlag === value) return;
  adminFlag = value;
  listeners.forEach((l) => l(value));
};

export const isAdminSync = (): boolean => adminFlag;

export const subscribeAdmin = (cb: (v: boolean) => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/**
 * Centralized freemium bypass. Returns true when the current user should
 * skip every client-side restriction (quota counters, premium modals,
 * feature locks, quiz limits, …).
 *
 * Sources considered:
 *  - `isAdminSync()` — real admin role, verified server-side.
 *  - Vite DEV mode / preview domains (already handled by `isDevMode`
 *    inside `usage-quota.ts`; re-checked here so callers that don't want
 *    to import that module still get the same behavior).
 */
export const hasUnlimitedAccess = (): boolean => {
  if (adminFlag) return true;
  try {
    if (import.meta.env?.DEV) return true;
    if (import.meta.env?.VITE_DEV_BYPASS === "true") return true;
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h.endsWith(".lovable.app") ||
      h.endsWith(".lovableproject.com") ||
      h.endsWith(".lovable.dev")
    ) {
      return true;
    }
  }
  return false;
};
