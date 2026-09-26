import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const shouldFetchLatest = !tripId && !tripData?.destination && !!user;

  const { data: latestTrip } = useQuery({
    queryKey: ["latest-trip", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("id, destination, arrival_city, departure_date, return_date")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
    enabled: shouldFetchLatest,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!latestTrip?.id) return;
    setActiveTrip({
      tripId: latestTrip.id,
      destination: latestTrip.destination,
      arrivalCity: latestTrip.arrival_city,
      departureDate: latestTrip.departure_date,
      returnDate: latestTrip.return_date,
    });
    hydrateTravelStoreFromTrip(latestTrip.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestTrip?.id]);
};
