import { useEffect, useState } from "react";
import { TripActivity, TripTracking } from "./useTracking";

const KEY = (tripId: string) => `xplania:tracking:${tripId}`;

export interface CachedTracking {
  tracking: TripTracking | null;
  activities: TripActivity[];
  cachedAt: number;
}

export function useOfflineCache(
  tripId: string | undefined,
  tracking: TripTracking | null,
  activities: TripActivity[],
) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!tripId || !isOnline) return;
    try {
      const payload: CachedTracking = { tracking, activities, cachedAt: Date.now() };
      localStorage.setItem(KEY(tripId), JSON.stringify(payload));
    } catch {}
  }, [tripId, tracking, activities, isOnline]);

  return { isOnline };
}

export function readCache(tripId: string): CachedTracking | null {
  try {
    const raw = localStorage.getItem(KEY(tripId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
