import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TripActivity } from "@/hooks/useTracking";

export interface TripStats {
  distanceKm: number;
  placesVisited: number;
  placesTotal: number;
  activities: TripActivity[];
  positions: { lat: number; lng: number }[];
  budgetPlanned: number | null;
  budgetSpent: number | null;
}

const fetchTripStats = async (
  tripId: string,
  destination?: string,
  departureDate?: string | null,
): Promise<TripStats> => {
  const [tr, acts, pos] = await Promise.all([
    supabase.from("trip_tracking").select("total_distance_km").eq("trip_id", tripId).maybeSingle(),
    supabase.from("trip_activities").select("*").eq("trip_id", tripId).order("position"),
    supabase.from("trip_positions").select("lat,lng").eq("trip_id", tripId).order("recorded_at").limit(2000),
  ]);
  const activities = (acts.data || []) as TripActivity[];

  let budgetPlanned: number | null = null;
  let budgetSpent: number | null = null;
  try {
    const raw = localStorage.getItem(`xplania-budget-state::${destination || ""}::${departureDate || "na"}`);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.categories)) budgetPlanned = p.categories.reduce((s: number, c: any) => s + (Number(c.planned) || 0), 0);
      if (Array.isArray(p.expenses)) budgetSpent = p.expenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
    }
  } catch { /* ignore */ }

  return {
    distanceKm: Number(tr.data?.total_distance_km || 0),
    placesVisited: activities.filter((a) => a.status === "done").length,
    placesTotal: activities.length,
    activities,
    positions: (pos.data || []) as { lat: number; lng: number }[],
    budgetPlanned,
    budgetSpent,
  };
};

/** Aggregates data already stored elsewhere (Suivi live + Guide Budget) for the logbook. */
export function useTripStats(tripId?: string, destination?: string, departureDate?: string | null) {
  const { data } = useQuery({
    queryKey: ["trip-stats", tripId, destination, departureDate],
    queryFn: () => fetchTripStats(tripId!, destination, departureDate),
    enabled: !!tripId,
  });

  return data ?? null;
}
