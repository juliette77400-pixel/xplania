// Leaflet plugins (markercluster, heat) expect a global `L`. In production
// builds, static imports of plugins can run before `window.L` is set, which
// crashes pages ("Can't find variable: L"). So plugins are loaded lazily,
// only after the global is guaranteed to exist.
import L from "leaflet";

(window as unknown as { L: typeof L }).L = L;

let clusterPromise: Promise<unknown> | null = null;
let heatPromise: Promise<unknown> | null = null;

export const loadMarkerCluster = () => {
  (window as unknown as { L: typeof L }).L = L;
  clusterPromise ??= import("leaflet.markercluster");
  return clusterPromise;
};

export const loadHeat = () => {
  (window as unknown as { L: typeof L }).L = L;
  heatPromise ??= import("leaflet.heat");
  return heatPromise;
};

export default L;
