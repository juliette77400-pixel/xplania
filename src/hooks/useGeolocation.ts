import { useEffect, useRef, useState } from "react";
import { ipGeolocate } from "@/lib/geocoding";

export type Precision = "high" | "balanced" | "low";

export interface Position {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  timestamp: number;
  source?: "gps" | "ip";
}

interface Options {
  enabled: boolean;
  precision?: Precision;
  /** Min ms between callbacks delivered to consumers (smoothing). */
  throttleMs?: number;
  /** Try IP geolocation if permission denied / unavailable. */
  ipFallback?: boolean;
  onPosition?: (p: Position) => void;
}

export function useGeolocation({
  enabled,
  precision = "balanced",
  throttleMs = 10000,
  ipFallback = true,
  onPosition,
}: Options) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | "unknown">("unknown");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const callbackRef = useRef(onPosition);
  const lastEmitRef = useRef(0);
  const ipTriedRef = useRef(false);

  useEffect(() => { callbackRef.current = onPosition; }, [onPosition]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Géolocalisation non supportée");
      return;
    }
    navigator.permissions?.query({ name: "geolocation" as PermissionName })
      .then((p) => {
        setPermission(p.state);
        p.onchange = () => setPermission(p.state);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const cleanup = () => {
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!("geolocation" in navigator)) {
      // IP fallback only
      if (ipFallback && !ipTriedRef.current) {
        ipTriedRef.current = true;
        ipGeolocate().then((g) => {
          if (g) {
            const p: Position = {
              lat: g.lat, lng: g.lng, accuracy: 5000, speed: null,
              timestamp: Date.now(), source: "ip",
            };
            setPosition(p); setError(null);
            callbackRef.current?.(p);
          }
        });
      }
      return cleanup;
    }

    const emit = (p: Position) => {
      const now = Date.now();
      // Always update internal state (no flicker — see consumers using setLatLng).
      setPosition(p);
      setError(null);
      // Throttle external callback to reduce DB writes / notifications.
      if (now - lastEmitRef.current >= throttleMs) {
        lastEmitRef.current = now;
        callbackRef.current?.(p);
      }
    };

    const handle = (pos: GeolocationPosition) => emit({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
      source: "gps",
    });

    const errCb = (e: GeolocationPositionError) => {
      setError(e.message || "GPS indisponible");
      // IP fallback once per session
      if (ipFallback && !ipTriedRef.current) {
        ipTriedRef.current = true;
        ipGeolocate().then((g) => {
          if (g) emit({
            lat: g.lat, lng: g.lng, accuracy: 5000, speed: null,
            timestamp: Date.now(), source: "ip",
          });
        });
      }
    };

    if (precision === "low") {
      const tick = () => navigator.geolocation.getCurrentPosition(handle, errCb, {
        enableHighAccuracy: false, maximumAge: 60000, timeout: 30000,
      });
      tick();
      intervalRef.current = window.setInterval(tick, 60000);
    } else {
      // high & balanced: use watchPosition, but inflate maximumAge so we don't
      // re-render on every micro-update (kills marker flicker on map).
      watchIdRef.current = navigator.geolocation.watchPosition(handle, errCb, {
        enableHighAccuracy: precision === "high",
        maximumAge: precision === "high" ? 5000 : 15000,
        timeout: 30000,
      });
    }

    return cleanup;
  }, [enabled, precision, throttleMs, ipFallback]);

  return { position, error, permission };
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.sin(dLng/2)**2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
