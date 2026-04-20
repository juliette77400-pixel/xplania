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

export const getUsage = (tool: QuotaTool): number => {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY(tool)) || "0", 10);
};

export const getLimit = (tool: QuotaTool) => LIMITS[tool];

export const getRemaining = (tool: QuotaTool) => Math.max(0, LIMITS[tool] - getUsage(tool));

export const hasReached = (tool: QuotaTool) => getUsage(tool) >= LIMITS[tool];

export const incrementUsage = (tool: QuotaTool): { reached: boolean; usage: number } => {
  const next = getUsage(tool) + 1;
  localStorage.setItem(KEY(tool), String(next));
  return { reached: next >= LIMITS[tool], usage: next };
};

export const resetUsage = (tool: QuotaTool) => {
  localStorage.removeItem(KEY(tool));
};
