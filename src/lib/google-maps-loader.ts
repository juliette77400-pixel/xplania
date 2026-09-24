/* eslint-disable @typescript-eslint/no-explicit-any */
// Loads the Google Maps JavaScript API once. Rejects when the key is refused
// (e.g. referrer restrictions) so callers can fall back to the Leaflet map.

import { supabase } from "@/integrations/supabase/client";

let promise: Promise<any> | null = null;

/** The managed browser key only works on Lovable domains (and localhost for dev). */
export function isLovableHost(host: string): boolean {
  return (
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host === "localhost" ||
    host.endsWith(".localhost")
  );
}

/**
 * Which browser key to try first for the given host:
 *  - Lovable domains (incl. preview): the Lovable-managed browser key;
 *  - any other domain (xplania.app): the founder's own key, served by the
 *    `maps-browser-key` edge function (referrer-restricted in Google Cloud).
 * `edgeKeyReady` fetches the founder's key lazily; returns undefined when
 * signed out or the function is unavailable.
 */
async function resolveBrowserKey(
  host: string,
  managedKey: string | undefined,
  edgeKeyReady: () => Promise<string | undefined>,
): Promise<string | undefined> {
  if (managedKey && isLovableHost(host)) return managedKey;
  return edgeKeyReady();
}

async function fetchEdgeKey(): Promise<string | undefined> {
  try {
    const { data, error } = await supabase.functions.invoke("maps-browser-key");
    if (!error && data?.key) return data.key as string;
  } catch {
    // signed out or function unavailable — fall back to the Leaflet map
  }
  return undefined;
}

function loadWithKey(key: string, channel: string): Promise<any> {
  const w = window as any;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("google_maps_timeout")), 12000);
    w.__xplaniaGmapsReady = () => { window.clearTimeout(timer); resolve(w.google.maps); };
    w.gm_authFailure = () => { window.clearTimeout(timer); reject(new Error("google_maps_auth")); };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__xplaniaGmapsReady&channel=${channel}&v=weekly`;
    s.async = true;
    s.onerror = () => { window.clearTimeout(timer); reject(new Error("google_maps_script")); };
    document.head.appendChild(s);
  });
}

export function loadGoogleMaps(): Promise<any> {
  const w = window as any;
  if (w.google?.maps?.Map) return Promise.resolve(w.google.maps);
  if (promise) return promise;

  promise = (async () => {
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "";
    const managedKey = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    let key = await resolveBrowserKey(window.location.hostname, managedKey, fetchEdgeKey);
    if (!key) throw new Error("google_maps_unavailable");
    try {
      return await loadWithKey(key, channel);
    } catch (err) {
      if ((err as Error).message !== "google_maps_auth") throw err;
      // First key refused — retry once with the edge-served key.
      promise = null;
      key = await fetchEdgeKey();
      if (!key) throw err;
      return await loadWithKey(key, channel);
    }
  })().catch((err) => {
    promise = null;
    window.dispatchEvent(new Event("gmaps-auth-failure"));
    throw err;
  });
  return promise;
}

/** Xplania dark "night travel" map style. */
export const XPLANIA_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f1629" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ea3c7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1120" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#24324f" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c2742" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#223052" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c3b66" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1a2440" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#67e8f9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#07213a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3b6b99" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#111c33" }] },
];
