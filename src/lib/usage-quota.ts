// Freemium quotas for Xplania beta.
// Each tool has a free usage count stored in localStorage.
// When exceeded → UpgradeDialog (vitrine, no real payment).

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
  mood: 1,
  explore: 1,
  carnet: 1,
  suivi: 1,
};

const KEY = (t: QuotaTool) => `xplania_usage_${t}`;
const DEV_KEY = "xplania_dev_mode";

/**
 * Developer / unlimited mode.
 * Auto-enabled on:
 *  - localhost / 127.0.0.1
 *  - *.lovable.app and *.lovableproject.com (preview & published dev domains)
 *  - when localStorage flag `xplania_dev_mode` = "1" (manual override)
 *
 * Toggle from console: localStorage.setItem('xplania_dev_mode','1')  /  removeItem('xplania_dev_mode')
 */
export const isDevMode = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(DEV_KEY) === "1") return true;
    if (localStorage.getItem(DEV_KEY) === "0") return false; // explicit opt-out
  } catch {}
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.endsWith(".lovable.app") ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".lovable.dev")
  );
};

export const enableDevMode = () => {
  try { localStorage.setItem(DEV_KEY, "1"); } catch {}
};
export const disableDevMode = () => {
  try { localStorage.setItem(DEV_KEY, "0"); } catch {}
};

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

export const incrementUsage = (tool: QuotaTool): { reached: boolean; usage: number } => {
  if (isDevMode()) return { reached: false, usage: 0 };
  const next = getUsage(tool) + 1;
  localStorage.setItem(KEY(tool), String(next));
  return { reached: next >= LIMITS[tool], usage: next };
};

export const resetUsage = (tool: QuotaTool) => {
  localStorage.removeItem(KEY(tool));
};

/** Reset all quotas across every tool (dev convenience). */
export const resetAllUsage = () => {
  (Object.keys(LIMITS) as QuotaTool[]).forEach(resetUsage);
};

// Expose helpers on window for quick console access during development.
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).xplaniaDev = {
    enable: enableDevMode,
    disable: disableDevMode,
    reset: resetAllUsage,
    isDev: isDevMode,
  };
}
