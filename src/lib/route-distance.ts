import { haversineKm } from "@/hooks/useGeolocation";
import type { TripActivity } from "@/hooks/useTracking";

export type LatLng = { lat: number; lng: number };

/** Activities with coordinates, ordered by day then position (the planned A→Z route). */
export function orderedStops(activities: TripActivity[]) {
  return activities
    .filter((a) => a.lat != null && a.lng != null)
    .sort((x, y) => {
      const d = (x.day_date || "").localeCompare(y.day_date || "");
      return d !== 0 ? d : x.position - y.position;
    });
}

export function pathKm(points: LatLng[]) {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += haversineKm(points[i - 1], points[i]);
  return km;
}

/** Keeps at most `max` evenly spaced points, always including first and last. */
export function samplePoints<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const out: T[] = [];
  const step = (points.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

export const checkpointLabel = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : String(i + 1));
