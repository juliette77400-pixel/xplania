import { createContext, useContext, useState, ReactNode } from "react";
import type { TravelFormData, TravelRecommendations } from "@/types/travel";

interface TravelContextType {
  tripData: TravelFormData | null;
  setTripData: (data: TravelFormData | null) => void;
  recommendations: TravelRecommendations | null;
  setRecommendations: (recs: TravelRecommendations | null) => void;
  dashboardLoading: boolean;
  setDashboardLoading: (loading: boolean) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider = ({ children }: { children: ReactNode }) => {
  const [tripData, setTripData] = useState<TravelFormData | null>(null);
  const [recommendations, setRecommendations] = useState<TravelRecommendations | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  return (
    <TravelContext.Provider
      value={{ tripData, setTripData, recommendations, setRecommendations, dashboardLoading, setDashboardLoading }}
    >
      {children}
    </TravelContext.Provider>
  );
};

export const useTravelContext = () => {
  const ctx = useContext(TravelContext);
  if (!ctx) throw new Error("useTravelContext must be used within TravelProvider");
  return ctx;
};
