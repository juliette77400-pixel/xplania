import { useEffect, useState } from "react";
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

export const useTrips = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTrips((data || []) as Trip[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  // ✨ NEW (Tâche 1) — retrait optimiste local après suppression côté DB
  const removeTrip = (tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  };

  return { trips, loading, refetch: fetch, removeTrip };
};
