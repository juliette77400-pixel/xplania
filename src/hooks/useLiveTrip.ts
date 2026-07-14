import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTrip } from "@/stores/useActiveTrip";
import type { TravelFormData } from "@/types/travel";

export interface LiveTrip {
  id: string;
  destination: string | null;
  arrival_city: string | null;
  departure_location: string | null;
  departure_date: string | null;
  return_date: string | null;
  duration: number | null;
  form_data: Partial<TravelFormData> | null;
  updated_at: string;
}

export const liveTripQueryKey = (tripId: string | undefined) =>
  ["trips", "live", tripId] as const;

const syncActiveTrip = (row: LiveTrip) => {
  useActiveTrip.getState().setActiveTrip({
    tripId: row.id,
    destination: row.destination,
    arrivalCity: row.arrival_city,
    departureDate: row.departure_date,
    returnDate: row.return_date,
  });
};

/**
 * useLiveTrip — React Query cache for the `trips` row of the active tripId
 * plus a realtime channel that patches the cache when the row changes.
 */
export function useLiveTrip(tripId: string | undefined) {
  const qc = useQueryClient();

  const { data: trip = null, isLoading } = useQuery({
    queryKey: liveTripQueryKey(tripId),
    enabled: !!tripId,
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("id, destination, arrival_city, departure_location, departure_date, return_date, duration, form_data, updated_at")
        .eq("id", tripId!)
        .maybeSingle();
      if (!data) return null;
      const row = data as unknown as LiveTrip;
      syncActiveTrip(row);
      return row;
    },
  });

  useEffect(() => {
    if (!tripId) return;
    const channel = supabase
      .channel(`trip-live-${tripId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        (payload) => {
          const row = payload.new as unknown as LiveTrip;
          qc.setQueryData(liveTripQueryKey(tripId), row);
          syncActiveTrip(row);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, qc]);

  return { trip, loading: !!tripId && isLoading };
}
