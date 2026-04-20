import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Position, haversineKm } from "@/hooks/useGeolocation";
import { TripActivity } from "@/hooks/useTracking";
import { toast } from "sonner";

const CHECKIN_RADIUS_KM = 0.1; // 100m
const DWELL_MS = 90_000; // 1.5 min

export function useCheckIn(
  tripId: string | undefined,
  position: Position | null,
  activities: TripActivity[],
  onCheckIn?: (activity: TripActivity) => void,
) {
  const { user } = useAuth();
  const dwellStartRef = useRef<Record<string, number>>({});
  const lastTriggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tripId || !user || !position) return;
    const now = Date.now();
    activities.forEach((act) => {
      if (act.status === "done" || !act.lat || !act.lng) return;
      if (lastTriggeredRef.current.has(act.id)) return;
      const dist = haversineKm(position, { lat: act.lat, lng: act.lng });
      if (dist <= CHECKIN_RADIUS_KM) {
        if (!dwellStartRef.current[act.id]) {
          dwellStartRef.current[act.id] = now;
        } else if (now - dwellStartRef.current[act.id] >= DWELL_MS) {
          lastTriggeredRef.current.add(act.id);
          (async () => {
            await supabase.from("trip_checkins").insert({
              trip_id: tripId, activity_id: act.id, user_id: user.id,
              lat: position.lat, lng: position.lng, distance_m: dist * 1000,
            });
            await supabase.from("trip_activities")
              .update({ status: "done", completed_at: new Date().toISOString() })
              .eq("id", act.id);
            toast.success(`📍 Tu es arrivé à "${act.title}" — ajouté au carnet ?`);
            onCheckIn?.(act);
          })();
        }
      } else {
        delete dwellStartRef.current[act.id];
      }
    });
  }, [position, activities, tripId, user, onCheckIn]);
}
