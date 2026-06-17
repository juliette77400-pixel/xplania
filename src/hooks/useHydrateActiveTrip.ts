import { useEffect, useState } from "react";
import { useActiveTrip, hydrateTravelStoreFromTrip } from "@/stores/useActiveTrip";
import { useTravelStore } from "@/stores/useTravelStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TravelFormData } from "@/types/travel";

/**
 * Ensures the global travel store (form + recommendations) is populated
 * from the currently active trip. Use on guide pages (Valise/Budget/Visa)
 * so they show the user's real trip data even when opened directly.
 */
export const useHydrateActiveTrip = () => {
  const tripId = useActiveTrip((s) => s.tripId);
  const destination = useActiveTrip((s) => s.destination);
  const arrivalCity = useActiveTrip((s) => s.arrivalCity);
  const departureDate = useActiveTrip((s) => s.departureDate);
  const returnDate = useActiveTrip((s) => s.returnDate);
  const tripData = useTravelStore((s) => s.tripData);
  const setTripData = useTravelStore((s) => s.setTripData);
  const setActiveTrip = useActiveTrip((s) => s.setActiveTrip);
  const { user } = useAuth();
  const [checkedLatest, setCheckedLatest] = useState(false);

  useEffect(() => {
    if (tripId && !tripData?.destination) {
      if (destination) {
        setTripData({
          destination,
          arrivalCity: arrivalCity || "",
          departureLocation: "",
          departureDate: departureDate || "",
          returnDate: returnDate || "",
          duration: "",
          totalBudget: 0,
        } as TravelFormData);
      }
      hydrateTravelStoreFromTrip(tripId);
    }
  }, [arrivalCity, departureDate, destination, returnDate, setTripData, tripData?.destination, tripId]);

  useEffect(() => {
    if (tripId || tripData?.destination || !user || checkedLatest) return;

    let cancelled = false;
    setCheckedLatest(true);
    supabase
      .from("trips")
      .select("id, destination, arrival_city, departure_date, return_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.id) return;
        setActiveTrip({
          tripId: data.id,
          destination: data.destination,
          arrivalCity: data.arrival_city,
          departureDate: data.departure_date,
          returnDate: data.return_date,
        });
        hydrateTravelStoreFromTrip(data.id);
      });

    return () => {
      cancelled = true;
    };
  }, [checkedLatest, setActiveTrip, tripData?.destination, tripId, user]);
};
