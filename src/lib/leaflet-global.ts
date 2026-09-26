// Leaflet plugins (markercluster, heat) expect a global `L`. In production
// builds it isn't defined, which crashes pages ("Can't find variable: L").
// Import this module BEFORE any Leaflet plugin.
import L from "leaflet";

(window as unknown as { L: typeof L }).L = L;

export default L;
