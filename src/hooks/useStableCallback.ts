import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * Returns a stable-identity callback that always calls the latest version of `fn`.
 *
 * Solves the classic problem: you need a function inside a `useEffect` /
 * `useCallback` dependency array, but the function is redefined every render
 * — which would re-run the effect on every render. Wrapping the function in
 * `useStableCallback` gives it a stable identity, safe to list as a dep, while
 * the effect still sees the latest closure (props, state, i18n, etc.).
 *
 * Modeled after the React `useEvent` RFC. Do NOT call the returned function
 * during render — only from effects, event handlers, or async callbacks.
 */
export function useStableCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R {
  const ref = useRef(fn);
  // Keep the ref current across renders. Layout-effect ordering isn't needed
  // because we never call the callback synchronously during render.
  useEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: Args) => ref.current(...args), []);
}

/**
 * Memoize a value using a custom equality check. Prevents downstream effects
 * from re-running when a newly-created object is structurally identical to
 * the previous one (typical trap for `{ lat, lng }` objects from geolocation
 * hooks that recreate the object every tick).
 */
export function useEqualMemo<T>(value: T, isEqual: (a: T, b: T) => boolean): T {
  const ref = useRef(value);
  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

const R_EARTH_M = 6_371_000;

/**
 * Haversine distance in meters between two coordinates. Kept here so callers
 * can reuse the same threshold semantics as `useStableCoords`.
 */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R_EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Returns a stable-identity coordinates object that only changes when the
 * user has moved more than `thresholdMeters` (default 50 m). This is the
 * primary guard against redundant geolocation-triggered API calls in effects
 * like `useNearbyPOI`, `useNearbyAlerts`, `useDiscover`.
 *
 * Passing `null` returns `null` stably.
 */
export function useStableCoords(
  coords: { lat: number; lng: number } | null | undefined,
  thresholdMeters = 50,
): { lat: number; lng: number } | null {
  return useEqualMemo(coords ?? null, (a, b) => {
    if (a === b) return true;
    if (!a || !b) return false;
    return distanceMeters(a, b) < thresholdMeters;
  });
}

/**
 * Runs `effect` only when `deps` changed AND the caller passes the effect
 * through `useStableCallback`. This is a thin convenience wrapper that makes
 * the intent explicit at call sites: "the effect body reads latest props, so
 * only the listed deps decide when to re-run".
 *
 * Prefer this over `// eslint-disable-next-line react-hooks/exhaustive-deps`
 * when the true trigger set is narrower than what the linter infers.
 */
export function useTriggerEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
): void {
  const stable = useStableCallback(effect);
  // The stable callback keeps a constant identity — only `deps` gate the run.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => stable(), deps);
}

/**
 * Debounce a value: the returned value only updates after `delayMs` of
 * stability. Useful to gate expensive queries in effects that would otherwise
 * fire on every keystroke or every GPS tick.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const ref = useRef(value);
  const memoized = useMemo(() => ({ current: value }), [value]);
  useEffect(() => {
    const id = setTimeout(() => {
      ref.current = memoized.current;
    }, delayMs);
    return () => clearTimeout(id);
  }, [memoized, delayMs]);
  return ref.current;
}
