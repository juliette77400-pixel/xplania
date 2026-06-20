import { useEffect, useState } from "react";
import { TripActivity, TripTracking } from "./useTracking";

const KEY = (tripId: string) => `xplania:tracking:${tripId}`;
const KEY_NS = (tripId: string, kind: string) => `xplania:${kind}:${tripId}`;
const KEY_USER = (userId: string, kind: string) => `xplania:${kind}:user:${userId}`;

export interface CachedTracking {
  tracking: TripTracking | null;
  activities: TripActivity[];
  cachedAt: number;
}

export interface CachedPayload<T> {
  data: T;
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

/** Generic trip-scoped cache (alerts, settings, badges_summary, etc.) */
export function cacheTripData<T>(tripId: string, kind: string, data: T) {
  try {
    const payload: CachedPayload<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(KEY_NS(tripId, kind), JSON.stringify(payload));
  } catch {}
}

export function readTripData<T>(tripId: string, kind: string): CachedPayload<T> | null {
  try {
    const raw = localStorage.getItem(KEY_NS(tripId, kind));
    return raw ? (JSON.parse(raw) as CachedPayload<T>) : null;
  } catch { return null; }
}

/** Generic user-scoped cache (badges summary across trips, etc.) */
export function cacheUserData<T>(userId: string, kind: string, data: T) {
  try {
    const payload: CachedPayload<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(KEY_USER(userId, kind), JSON.stringify(payload));
  } catch {}
}

export function readUserData<T>(userId: string, kind: string): CachedPayload<T> | null {
  try {
    const raw = localStorage.getItem(KEY_USER(userId, kind));
    return raw ? (JSON.parse(raw) as CachedPayload<T>) : null;
  } catch { return null; }
}

/** Subscribe to online/offline status from any component. */
export function useOnlineStatus() {
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
  return isOnline;
}
