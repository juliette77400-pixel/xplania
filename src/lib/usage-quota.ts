// Client-side quota view.
//
// The single source of truth is the database (`public.usage_counters`) —
// this module only mirrors the server state for the UI. Every actual
// consumption happens server-side inside the edge functions via the
// `consume_quota` RPC, so tampering with localStorage does not grant
// extra generations.
//
// The `isDevMode()` fallback below only trips for real local development
// (localhost / VITE_DEV_BYPASS / `import.meta.env.DEV`). The old
// `*.lovable.app` / `*.lovableproject.com` / `*.lovable.dev` bypass has
// been removed on purpose: preview builds must now show the real paywall
// so it can be tested end-to-end. Only the server-verified admin role
// (via `hasUnlimitedAccess()`) grants unlimited access in production.

import { isAdminSync } from "@/lib/admin-access";

export type QuotaTool =
  | "valise"
  | "budget"
  | "visa"
  | "discover"
  | "mood"
  | "explore"
  | "carnet"
  | "suivi";

const LIMITS: Record<QuotaTool, number> = {
  valise: 3,
  budget: 3,
  visa: 3,
  discover: 1,
  mood: 3,
  explore: 1,
  carnet: 1,
  suivi: 1,
};

const KEY = (t: QuotaTool) => `xplania_usage_${t}`;
const DEV_KEY = "xplania_dev_mode";

/**
 * Local dev bypass. Real admins bypass via `isAdminSync()`. This flag ONLY
 * trips on:
 *  - Vite `import.meta.env.DEV` (true `npm run dev`)
 *  - `VITE_DEV_BYPASS=true`
 *  - `localhost` / `127.0.0.1`
 *  - Manual `localStorage.setItem('xplania_dev_mode','1')` (dev convenience)
 *
 * Notably: `*.lovable.app`, `*.lovableproject.com`, `*.lovable.dev` no
 * longer trip this — preview / published domains apply the real paywall.
 */
export const isDevMode = (): boolean => {
  if (typeof window === "undefined") return false;
  if (isAdminSync()) return true;
  try {
    if (import.meta.env?.VITE_DEV_BYPASS === "true" || import.meta.env?.VITE_DEV_BYPASS === true) {
      return true;
    }
    if (import.meta.env?.DEV === true || import.meta.env?.MODE === "development") {
      return true;
    }
  } catch {
    /* noop */
  }
  try {
    if (localStorage.getItem(DEV_KEY) === "1") return true;
    if (localStorage.getItem(DEV_KEY) === "0") return false;
  } catch {
    /* noop */
  }
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
};

export const enableDevMode = () => {
  try { localStorage.setItem(DEV_KEY, "1"); } catch { /* noop */ }
};
export const disableDevMode = () => {
  try { localStorage.setItem(DEV_KEY, "0"); } catch { /* noop */ }
};

/**
 * Legacy localStorage counter (kept as a hint for older code paths). The
 * authoritative value lives on the server and is read by `useQuota`.
 */
export const getUsage = (tool: QuotaTool): number => {
  if (typeof window === "undefined") return 0;
  if (isDevMode()) return 0;
  return parseInt(localStorage.getItem(KEY(tool)) || "0", 10);
};

export const getLimit = (tool: QuotaTool) => (isDevMode() ? Infinity : LIMITS[tool]);

export const getRemaining = (tool: QuotaTool) =>
  isDevMode() ? Infinity : Math.max(0, LIMITS[tool] - getUsage(tool));

export const hasReached = (tool: QuotaTool) => {
  if (isDevMode()) return false;
  return getUsage(tool) >= LIMITS[tool];
};

/**
 * Local cache mirror. The server-side counter is the source of truth;
 * this only exists so components that read `getUsage` without going
 * through React Query still see a plausible value.
 */
export const setLocalUsage = (tool: QuotaTool, used: number) => {
  try { localStorage.setItem(KEY(tool), String(Math.max(0, used))); } catch { /* noop */ }
};

export const incrementUsage = (tool: QuotaTool): { reached: boolean; usage: number } => {
  if (isDevMode()) return { reached: false, usage: 0 };
  const next = getUsage(tool) + 1;
  localStorage.setItem(KEY(tool), String(next));
  return { reached: next >= LIMITS[tool], usage: next };
};

export const resetUsage = (tool: QuotaTool) => {
  localStorage.removeItem(KEY(tool));
};

export const resetAllUsage = () => {
  (Object.keys(LIMITS) as QuotaTool[]).forEach(resetUsage);
};

if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).xplaniaDev = {
    enable: enableDevMode,
    disable: disableDevMode,
    reset: resetAllUsage,
    isDev: isDevMode,
  };
}
