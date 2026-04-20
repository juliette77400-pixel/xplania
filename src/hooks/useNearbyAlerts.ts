import { useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Place } from "./useDiscover";

const COOLDOWN_MS = 10 * 60 * 1000; // 10 min between alerts
const PROXIMITY_M = 250;

export function useNearbyAlerts(userPos: { lat: number; lng: number } | null, places: Place[]) {
  const { permission, notify } = useNotifications();
  const { user } = useAuth();
  const lastAlertRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!userPos || permission !== "granted" || !user) return;
    const candidates = places.filter((p) => p.hidden_gem && p.distance_km != null && p.distance_km * 1000 <= PROXIMITY_M);
    const now = Date.now();
    for (const p of candidates) {
      const last = lastAlertRef.current[p.id] || 0;
      if (now - last < COOLDOWN_MS) continue;
      lastAlertRef.current[p.id] = now;
      const title = `✨ ${p.name} à ${(p.distance_km! * 1000).toFixed(0)} m`;
      const body = p.why_fits || p.description || "Hidden gem juste à côté de toi";
      notify(title, body);
      supabase.from("discover_notifications").insert({
        user_id: user.id, type: "nearby", place_id: p.id, title, body,
      }).then(() => {});
    }
  }, [userPos?.lat, userPos?.lng, places, permission, user, notify]);

  return { permission };
}
