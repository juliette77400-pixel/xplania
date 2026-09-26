import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Position, haversineKm } from "@/hooks/useGeolocation";
import { TripActivity } from "@/hooks/useTracking";
import { toast } from "sonner";
import { pingStreakAction } from "@/lib/streak";
import i18n from "@/i18n";

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

  const checkInMutation = useMutation({
    mutationFn: async ({ act, pos, dist, trip }: { act: TripActivity; pos: Position; dist: number; trip: string }) => {
      await supabase.from("trip_checkins").insert({
        trip_id: trip, activity_id: act.id, user_id: user!.id,
        lat: pos.lat, lng: pos.lng, distance_m: dist * 1000,
      });
      await supabase.from("trip_activities")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", act.id);
      return act;
    },
    onSuccess: (act) => {
      toast.success(i18n.t("ui2.useCheckIn.arrived", { title: act.title }));
      onCheckIn?.(act);
    },
  });

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
          checkInMutation.mutate({ act, pos: position, dist, trip: tripId });
        }
      } else {
        delete dwellStartRef.current[act.id];
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, activities, tripId, user, onCheckIn]);
}
