import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Position, haversineKm } from "@/hooks/useGeolocation";

export interface TripTracking {
  id: string;
  trip_id: string;
  is_active: boolean;
  share_enabled: boolean;
  share_slug: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_position_at: string | null;
  total_distance_km: number;
  settings: { precision?: "high" | "balanced" | "low"; notifications?: boolean };
  started_at: string | null;
  ended_at: string | null;
}

export interface TripActivity {
  id: string;
  trip_id: string;
  source: string;
  day_date: string | null;
  title: string;
  description: string | null;
  category: string | null;
  lat: number | null;
  lng: number | null;
  scheduled_at: string | null;
  status: "todo" | "in_progress" | "done";
  completed_at: string | null;
  position: number;
}

export function useTracking(tripId?: string) {
  const { user } = useAuth();
  const [tracking, setTracking] = useState<TripTracking | null>(null);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [positions, setPositions] = useState<{ lat: number; lng: number; recorded_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tripId || !user) return;
    setLoading(true);
    const [{ data: t }, { data: a }, { data: p }] = await Promise.all([
      supabase.from("trip_tracking").select("*").eq("trip_id", tripId).maybeSingle(),
      supabase.from("trip_activities").select("*").eq("trip_id", tripId).order("day_date").order("position"),
      supabase.from("trip_positions").select("lat,lng,recorded_at").eq("trip_id", tripId).order("recorded_at"),
    ]);
    setTracking(t as TripTracking | null);
    setActivities((a || []) as TripActivity[]);
    setPositions(p || []);
    setLoading(false);
  }, [tripId, user]);

  useEffect(() => { load(); }, [load]);

  // Realtime updates
  useEffect(() => {
    if (!tripId) return;
    const ch = supabase
      .channel(`tracking-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_activities", filter: `trip_id=eq.${tripId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_tracking", filter: `trip_id=eq.${tripId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tripId, load]);

  const ensureTracking = useCallback(async () => {
    if (!tripId || !user) return null;
    if (tracking) return tracking;
    const { data, error } = await supabase
      .from("trip_tracking")
      .insert({ trip_id: tripId, user_id: user.id })
      .select().single();
    if (error) throw error;
    setTracking(data as TripTracking);
    return data as TripTracking;
  }, [tripId, user, tracking]);

  const startTracking = useCallback(async (precision: "high" | "balanced" | "low" = "balanced") => {
    const t = await ensureTracking();
    if (!t || !tripId || !user) return;
    const { data } = await supabase
      .from("trip_tracking")
      .update({ is_active: true, started_at: new Date().toISOString(), settings: { ...t.settings, precision } })
      .eq("trip_id", tripId)
      .select().single();
    setTracking(data as TripTracking);
  }, [ensureTracking, tripId, user]);

  const stopTracking = useCallback(async () => {
    if (!tripId) return;
    const { data } = await supabase
      .from("trip_tracking")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("trip_id", tripId)
      .select().single();
    setTracking(data as TripTracking);
  }, [tripId]);

  const updatePrecision = useCallback(async (precision: "high" | "balanced" | "low") => {
    if (!tripId || !tracking) return;
    const { data } = await supabase
      .from("trip_tracking")
      .update({ settings: { ...tracking.settings, precision } })
      .eq("trip_id", tripId)
      .select().single();
    setTracking(data as TripTracking);
  }, [tripId, tracking]);

  const toggleShare = useCallback(async (enabled: boolean) => {
    if (!tripId || !tracking) return;
    const slug = tracking.share_slug || (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "").slice(0, 32);
    const { data } = await supabase
      .from("trip_tracking")
      .update({ share_enabled: enabled, share_slug: slug })
      .eq("trip_id", tripId)
      .select().single();
    setTracking(data as TripTracking);
  }, [tripId, tracking]);

  const recordPosition = useCallback(async (p: Position) => {
    if (!tripId || !user || !tracking?.is_active) return;
    const last = tracking.last_lat && tracking.last_lng
      ? { lat: tracking.last_lat, lng: tracking.last_lng } : null;
    const delta = last ? haversineKm(last, p) : 0;
    // Skip jitter < 10m
    if (last && delta < 0.01) return;

    await supabase.from("trip_positions").insert({
      trip_id: tripId, user_id: user.id, lat: p.lat, lng: p.lng,
      accuracy: p.accuracy, speed: p.speed,
    });
    const newDist = Number(tracking.total_distance_km) + delta;
    const { data } = await supabase
      .from("trip_tracking")
      .update({
        last_lat: p.lat, last_lng: p.lng, last_position_at: new Date().toISOString(),
        total_distance_km: newDist,
      })
      .eq("trip_id", tripId)
      .select().single();
    setTracking(data as TripTracking);
  }, [tripId, user, tracking]);

  const updateActivityStatus = useCallback(async (id: string, status: TripActivity["status"]) => {
    const patch: any = { status };
    if (status === "done") patch.completed_at = new Date().toISOString();
    await supabase.from("trip_activities").update(patch).eq("id", id);
  }, []);

  const seedActivities = useCallback(async () => {
    if (!tripId) return 0;
    const { data, error } = await supabase.functions.invoke("trip-seed-activities", { body: { tripId } });
    if (error) throw error;
    await load();
    return data?.count || 0;
  }, [tripId, load]);

  return {
    tracking, activities, positions, loading,
    startTracking, stopTracking, updatePrecision, toggleShare,
    recordPosition, updateActivityStatus, seedActivities, refetch: load,
  };
}
