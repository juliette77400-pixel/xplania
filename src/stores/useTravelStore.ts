import { create } from "zustand";
import type { TravelFormData, TravelRecommendations } from "@/types/travel";

interface TravelStore {
  tripData: TravelFormData | null;
  setTripData: (data: TravelFormData | null) => void;
  recommendations: TravelRecommendations | null;
  setRecommendations: (recs: TravelRecommendations | null) => void;
  dashboardLoading: boolean;
  setDashboardLoading: (loading: boolean) => void;
}

export const useTravelStore = create<TravelStore>((set) => ({
  tripData: null,
  setTripData: (tripData) => set({ tripData }),
  recommendations: null,
  setRecommendations: (recommendations) => set({ recommendations }),
  dashboardLoading: false,
  setDashboardLoading: (dashboardLoading) => set({ dashboardLoading }),
}));

// Backward-compatible alias
export const useTravelContext = () => useTravelStore();
