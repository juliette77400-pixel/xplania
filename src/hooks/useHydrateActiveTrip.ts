import { useEffect } from "react";
import { useActiveTrip, hydrateTravelStoreFromTrip } from "@/stores/useActiveTrip";
import { useTravelStore } from "@/stores/useTravelStore";

/**
 * Ensures the global travel store (form + recommendations) is populated
 * from the currently active trip. Use on guide pages (Valise/Budget/Visa)
 * so they show the user's real trip data even when opened directly.
 */
export const useHydrateActiveTrip = () => {
  const tripId = useActiveTrip((s) => s.tripId);
  const tripData = useTravelStore((s) => s.tripData);

  useEffect(() => {
    if (tripId && !tripData?.destination) {
      hydrateTravelStoreFromTrip(tripId);
    }
  }, [tripId, tripData?.destination]);
};
