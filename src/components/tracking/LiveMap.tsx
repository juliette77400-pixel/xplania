import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TripActivity } from "@/hooks/useTracking";
import { Position } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { ExternalLink, Navigation, Sparkles } from "lucide-react";
import { NearbyPOI, POI_COLORS, POI_LABELS } from "@/hooks/useNearbyPOI";

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const statusColor = { todo: "#94a3b8", in_progress: "#f59e0b", done: "#10b981" };

export interface AIPin {
  title: string;
  category: string;
  description?: string;
  reason?: string;
  lat: number;
  lng: number;
}

interface Props {
  position: Position | null;
  activities: TripActivity[];
  positions: { lat: number; lng: number }[];
  filter?: string;
  height?: string;
  pois?: NearbyPOI[];
  onPoiAddToCarnet?: (poi: NearbyPOI) => void;
  aiPins?: AIPin[];
  onAiPinAddToCarnet?: (pin: AIPin) => void;
}

const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points as any, { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
};

/**
 * Stable user marker — created once, only `setLatLng` afterwards (no flicker).
 */
const StableUserMarker = ({ position }: { position: Position | null }) => {
  const map = useMap();
  const markerRef = useRef<L.CircleMarker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);
  const recenterCountRef = useRef(0);

  useEffect(() => {
    if (!position) return;
    const latlng: L.LatLngExpression = [position.lat, position.lng];

    if (!markerRef.current) {
      accuracyRef.current = L.circle(latlng, {
        radius: Math.min(position.accuracy || 50, 200),
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
        weight: 1,
      }).addTo(map);

      markerRef.current = L.circleMarker(latlng, {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        className: "user-marker-stable",
      }).addTo(map);
      markerRef.current.bindPopup(
        position.source === "ip" ? "Position approximative (IP)" : "Tu es ici"
      );
      map.setView(latlng, Math.max(map.getZoom(), 14), { animate: true });
    } else {
      markerRef.current.setLatLng(latlng);
      accuracyRef.current?.setLatLng(latlng);
      accuracyRef.current?.setRadius(Math.min(position.accuracy || 50, 200));
      recenterCountRef.current += 1;
      if (recenterCountRef.current % 5 === 0) {
        map.panTo(latlng, { animate: true, duration: 0.8 });
      }
    }
  }, [position?.lat, position?.lng, position?.accuracy, position?.source, map]);

  useEffect(() => () => {
    if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }
    if (accuracyRef.current) { map.removeLayer(accuracyRef.current); accuracyRef.current = null; }
  }, [map]);

  return null;
};

/** Fetch a routed polyline A→B→C using OSRM public demo (free, OSM-based). */
async function fetchOsrmRoute(points: [number, number][]): Promise<[number, number][] | null> {
  if (points.length < 2) return null;
  try {
    const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const geo = json?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(geo)) return null;
    return geo.map((c: [number, number]) => [c[1], c[0]]);
  } catch {
    return null;
  }
}

const LiveMap = ({ position, activities, positions, filter, height = "500px", pois = [], onPoiAddToCarnet, aiPins = [], onAiPinAddToCarnet }: Props) => {
  const filtered = useMemo(
    () => activities.filter((a) => a.lat && a.lng && (!filter || a.category === filter)),
    [activities, filter]
  );

  // Ordered planned route (day_date then position)
  const orderedRoute = useMemo(() => {
    const ordered = [...filtered]
      .filter((a) => a.lat && a.lng)
      .sort((x, y) => {
        const d = (x.day_date || "").localeCompare(y.day_date || "");
        return d !== 0 ? d : x.position - y.position;
      });
    return ordered.map((a) => [a.lat!, a.lng!] as [number, number]);
  }, [filtered]);

  const [routeLine, setRouteLine] = useState<[number, number][] | null>(null);

  const routeSignature = useMemo(
    () => orderedRoute.map((p) => p.join(",")).join("|"),
    [orderedRoute],
  );
  useEffect(() => {
    let cancelled = false;
    if (orderedRoute.length < 2) { setRouteLine(null); return; }
    // OSRM has a hard limit; cap to 25 waypoints
    const capped = orderedRoute.slice(0, 25);
    fetchOsrmRoute(capped).then((line) => {
      if (!cancelled) setRouteLine(line);
    });
    return () => { cancelled = true; };
    // orderedRoute identity changes on every render; routeSignature captures its value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSignature]);

  const initialCenter: [number, number] = position
    ? [position.lat, position.lng]
    : filtered[0] ? [filtered[0].lat!, filtered[0].lng!]
    : [48.8566, 2.3522];

  const trail = positions.map((p) => [p.lat, p.lng]) as [number, number][];
  const allPoints: [number, number][] = [
    ...filtered.map((a) => [a.lat!, a.lng!] as [number, number]),
    ...(position ? [[position.lat, position.lng] as [number, number]] : []),
  ];

  const openExternal = (provider: "gmaps" | "osm") => {
    if (!position) return;
    const { lat, lng } = position;
    const url = provider === "gmaps"
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!position && allPoints.length > 1 ? <FitBounds points={allPoints} /> : null}

        {/* Real recorded GPS trail (cyan) */}
        {trail.length > 1 ? (
          <Polyline positions={trail} pathOptions={{ color: "#06b6d4", weight: 4, opacity: 0.7 }} />
        ) : null}

        {/* Planned A→B route (purple, dashed when fallback to straight line) */}
        {routeLine ? (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: "#a855f7", weight: 4, opacity: 0.85 }}
          />
        ) : orderedRoute.length > 1 ? (
          <Polyline
            positions={orderedRoute}
            pathOptions={{ color: "#a855f7", weight: 3, opacity: 0.6, dashArray: "8 8" }}
          />
        ) : null}

        {filtered.map((a, i) => (
          <CircleMarker
            key={a.id}
            center={[a.lat!, a.lng!]}
            radius={10}
            pathOptions={{
              color: statusColor[a.status],
              fillColor: statusColor[a.status],
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <strong>#{i + 1} — {a.title}</strong>
              {a.description && <p className="text-xs mt-1">{a.description}</p>}
              <p className="text-xs text-muted-foreground capitalize mt-1">{a.status}</p>
            </Popup>
          </CircleMarker>
        ))}

        {/* Nearby POI from OSM Overpass */}
        {pois.map((p) => (
          <CircleMarker
            key={`poi-${p.id}`}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{
              color: "#ffffff",
              fillColor: POI_COLORS[p.category],
              fillOpacity: 0.95,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-sm space-y-1.5 min-w-[180px]">
                <strong className="block">{p.name}</strong>
                <span className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ background: POI_COLORS[p.category] + "33", color: POI_COLORS[p.category] }}>
                  {POI_LABELS[p.category]}
                </span>
                {p.tags["addr:street"] && (
                  <p className="text-xs text-muted-foreground">{p.tags["addr:housenumber"] || ""} {p.tags["addr:street"]}</p>
                )}
                <div className="flex gap-1.5 pt-1">
                  <a
                    className="text-[11px] underline text-primary"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noopener"
                  >
                    Itinéraire ↗
                  </a>
                  {onPoiAddToCarnet && (
                    <button
                      className="text-[11px] underline text-primary ml-auto"
                      onClick={() => onPoiAddToCarnet(p)}
                    >
                      + Carnet
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* AI suggestion pins (golden stars) */}
        {aiPins.map((p, i) => (
          <CircleMarker
            key={`ai-${i}-${p.lat}-${p.lng}`}
            center={[p.lat, p.lng]}
            radius={9}
            pathOptions={{
              color: "#fbbf24",
              fillColor: "#f59e0b",
              fillOpacity: 0.95,
              weight: 2.5,
              dashArray: "2 3",
            }}
          >
            <Popup>
              <div className="text-sm space-y-1.5 min-w-[200px]">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                  <strong>{p.title}</strong>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full inline-block" style={{ background: "#f59e0b22", color: "#b45309" }}>
                  IA · {p.category}
                </span>
                {p.description && <p className="text-xs">{p.description}</p>}
                {p.reason && <p className="text-xs italic text-muted-foreground">→ {p.reason}</p>}
                <div className="flex gap-1.5 pt-1">
                  <a
                    className="text-[11px] underline text-primary"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noopener"
                  >
                    Itinéraire ↗
                  </a>
                  {onAiPinAddToCarnet && (
                    <button
                      className="text-[11px] underline text-primary ml-auto"
                      onClick={() => onAiPinAddToCarnet(p)}
                    >
                      + Carnet
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        <StableUserMarker position={position} />
      </MapContainer>

      {/* Floating fallback actions */}
      {position && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="shadow-lg backdrop-blur bg-background/90 hover:bg-background"
            onClick={() => openExternal("gmaps")}
          >
            <Navigation className="w-3.5 h-3.5 mr-1.5" />
            Google Maps
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="shadow-lg backdrop-blur bg-background/90 hover:bg-background"
            onClick={() => openExternal("osm")}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            OpenStreetMap
          </Button>
        </div>
      )}

      {position?.source === "ip" && (
        <div className="absolute bottom-3 left-3 z-[1000] text-xs px-2.5 py-1.5 rounded-md bg-warning text-warning-foreground shadow-lg">
          📍 Position approximative (IP) — active le GPS pour une position précise
        </div>
      )}
    </div>
  );
};

export default LiveMap;
