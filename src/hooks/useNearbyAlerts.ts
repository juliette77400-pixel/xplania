import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Place } from "./useDiscover";
import i18n from "@/i18n";

const COOLDOWN_MS = 10 * 60 * 1000; // 10 min between alerts
const PROXIMITY_M = 250;

export function useNearbyAlerts(userPos: { lat: number; lng: number } | null, places: Place[]) {
  const { permission, notify } = useNotifications();
  const { user } = useAuth();
  const lastAlertRef = useRef<Record<string, number>>({});

  const logAlertMutation = useMutation({
    mutationFn: async (vars: { placeId: string; title: string; body: string }) => {
      await supabase.from("discover_notifications").insert({
        user_id: user!.id, type: "nearby", place_id: vars.placeId, title: vars.title, body: vars.body,
      });
    },
  });

  useEffect(() => {
    if (!userPos || permission !== "granted" || !user) return;
    const candidates = places.filter((p) => p.hidden_gem && p.distance_km != null && p.distance_km * 1000 <= PROXIMITY_M);
    const now = Date.now();
    for (const p of candidates) {
      const last = lastAlertRef.current[p.id] || 0;
      if (now - last < COOLDOWN_MS) continue;
      lastAlertRef.current[p.id] = now;
      const title = i18n.t("ui2.useNearbyAlerts.title", { name: p.name, distance: (p.distance_km! * 1000).toFixed(0) });
      const body = p.why_fits || p.description || i18n.t("ui2.useNearbyAlerts.bodyFallback");
      notify(title, body);
      logAlertMutation.mutate({ placeId: p.id, title, body });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, places, permission, user, notify]);

  return { permission };
}
