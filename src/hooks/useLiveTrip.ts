import { useEffect, useState } from "react";
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

/**
 * useLiveTrip — subscribes to the `trips` row for the active tripId so any
 * change made elsewhere (form edits, transport choice, budget update…) is
 * reflected here in real time. Also keeps useActiveTrip in sync.
 */
export function useLiveTrip(tripId: string | undefined) {
  const [trip, setTrip] = useState<LiveTrip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setTrip(null);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("trips")
        .select("id, destination, arrival_city, departure_location, departure_date, return_date, duration, form_data, updated_at")
        .eq("id", tripId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const row = data as unknown as LiveTrip;
        setTrip(row);
        useActiveTrip.getState().setActiveTrip({
          tripId: row.id,
          destination: row.destination,
          arrivalCity: row.arrival_city,
          departureDate: row.departure_date,
          returnDate: row.return_date,
        });
      }
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`trip-live-${tripId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        (payload) => {
          const row = payload.new as unknown as LiveTrip;
          setTrip(row);
          useActiveTrip.getState().setActiveTrip({
            tripId: row.id,
            destination: row.destination,
            arrivalCity: row.arrival_city,
            departureDate: row.departure_date,
            returnDate: row.return_date,
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { trip, loading };
}
