import { useEffect, useRef, useState } from "react";

export type Precision = "high" | "balanced" | "low";

export interface Position {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  timestamp: number;
}

interface Options {
  enabled: boolean;
  precision?: Precision;
  onPosition?: (p: Position) => void;
}

export function useGeolocation({ enabled, precision = "balanced", onPosition }: Options) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | "unknown">("unknown");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const callbackRef = useRef(onPosition);

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
    if (!enabled || !("geolocation" in navigator)) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const handle = (pos: GeolocationPosition) => {
      const p: Position = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      };
      setPosition(p);
      setError(null);
      callbackRef.current?.(p);
    };
    const err = (e: GeolocationPositionError) => setError(e.message);

    if (precision === "low") {
      // poll every 60s, low accuracy
      const tick = () => navigator.geolocation.getCurrentPosition(handle, err, {
        enableHighAccuracy: false, maximumAge: 60000, timeout: 30000,
      });
      tick();
      intervalRef.current = window.setInterval(tick, 60000);
    } else {
      watchIdRef.current = navigator.geolocation.watchPosition(handle, err, {
        enableHighAccuracy: precision === "high",
        maximumAge: precision === "high" ? 0 : 15000,
        timeout: 30000,
      });
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, precision]);

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
