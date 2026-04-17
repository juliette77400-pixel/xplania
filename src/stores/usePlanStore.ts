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

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      tier: "free",
      generationsUsed: 0,
      freeQuota: 1,
      bannerDismissed: false,
      incrementGeneration: () =>
        set((s) => ({ generationsUsed: s.generationsUsed + 1 })),
      dismissBanner: () => set({ bannerDismissed: true }),
      upgradeToPremium: () => set({ tier: "premium" }),
      resetForDev: () =>
        set({ tier: "free", generationsUsed: 0, bannerDismissed: false }),
    }),
    { name: "xplania-plan" },
  ),
);
