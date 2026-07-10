import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Trip {
  id: string;
  title: string | null;
  destination: string | null;
  arrival_city: string | null;
  departure_date: string | null;
  return_date: string | null;
  duration: number | null;
  form_data: any;
  recommendations: any;
  created_at: string;
}

export const tripsQueryKey = (userId: string | undefined) => ["trips", userId] as const;

export const useTrips = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: tripsQueryKey(user?.id),
    // Only run once we know the user; keeps behaviour identical to the old
    // effect that returned an empty list when logged out.
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as Trip[];
    },
  });

  // Optimistic local removal after a DB delete — now updates the query cache
  // so every consumer of useTrips stays in sync.
  const removeTrip = (tripId: string) => {
    queryClient.setQueryData<Trip[]>(tripsQueryKey(user?.id), (prev) =>
      (prev || []).filter((t) => t.id !== tripId),
    );
  };

  return {
    trips: data ?? [],
    // When logged out the query is disabled (stays "pending"); surface it as
    // not-loading so consumers don't spin forever, matching the old hook.
    loading: user ? isLoading : false,
    refetch,
    removeTrip,
  };
};
