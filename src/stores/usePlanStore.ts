import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlanTier = "free" | "premium";

interface PlanStore {
  tier: PlanTier;
  generationsUsed: number;
  freeQuota: number;
  bannerDismissed: boolean;
  incrementGeneration: () => void;
  dismissBanner: () => void;
  upgradeToPremium: () => void;
  resetForDev: () => void;
}

const STORAGE_KEY = "xplania_generation_count";

// Custom storage that mirrors generationsUsed to xplania_generation_count
const customStorage = {
  getItem: (name: string) => {
    const raw = localStorage.getItem(name);
    if (raw) return raw;
    // Fallback: hydrate from legacy single-key counter
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (legacy !== null) {
      return JSON.stringify({
        state: {
          tier: "free",
          generationsUsed: parseInt(legacy, 10) || 0,
          freeQuota: 3,
          bannerDismissed: false,
        },
        version: 0,
      });
    }
    return null;
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
    try {
      const parsed = JSON.parse(value);
      const used = parsed?.state?.generationsUsed;
      if (typeof used === "number") {
        localStorage.setItem(STORAGE_KEY, String(used));
      }
    } catch {
      /* ignore */
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
    localStorage.removeItem(STORAGE_KEY);
  },
};

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      tier: "free",
      generationsUsed: 0,
      freeQuota: 3,
      bannerDismissed: false,
      incrementGeneration: () =>
        set((s) => ({ generationsUsed: s.generationsUsed + 1 })),
      dismissBanner: () => set({ bannerDismissed: true }),
      upgradeToPremium: () => set({ tier: "premium" }),
      resetForDev: () =>
        set({ tier: "free", generationsUsed: 0, bannerDismissed: false }),
    }),
    {
      name: "xplania-plan",
      storage: {
        getItem: (name) => {
          const v = customStorage.getItem(name);
          return v ? JSON.parse(v) : null;
        },
        setItem: (name, value) => customStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => customStorage.removeItem(name),
      },
    },
  ),
);

export const hasReachedFreeQuota = () => {
  const { tier, generationsUsed, freeQuota } = usePlanStore.getState();
  return tier === "free" && generationsUsed >= freeQuota;
};
