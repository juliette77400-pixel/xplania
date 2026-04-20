import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TripActivity } from "@/hooks/useTracking";
import { Position } from "@/hooks/useGeolocation";

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const statusColor = { todo: "#94a3b8", in_progress: "#f59e0b", done: "#10b981" };

interface Props {
  position: Position | null;
  activities: TripActivity[];
  positions: { lat: number; lng: number }[];
  filter?: string;
  height?: string;
}

const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points as any, { padding: [40, 40], maxZoom: 14 });
    }
  }, [points.length]);
  return null;
};

/**
 * Stable user marker — created once, only `setLatLng` afterwards.
 * This kills the "blinking" caused by React re-rendering CircleMarker on every GPS tick.
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
      // First-time creation
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
      }).addTo(map);
      markerRef.current.bindPopup(
        position.source === "ip" ? "Position approximative (IP)" : "Tu es ici"
      );
      map.setView(latlng, Math.max(map.getZoom(), 14), { animate: true });
    } else {
      // Just move it — no flicker
      markerRef.current.setLatLng(latlng);
      accuracyRef.current?.setLatLng(latlng);
      accuracyRef.current?.setRadius(Math.min(position.accuracy || 50, 200));
      // Soft recenter every ~5 updates so the map follows without yanking
      recenterCountRef.current += 1;
      if (recenterCountRef.current % 5 === 0) {
        map.panTo(latlng, { animate: true, duration: 0.8 });
      }
    }

    return () => {
      // Only cleanup on full unmount
    };
  }, [position?.lat, position?.lng, position?.accuracy, position?.source, map]);

  useEffect(() => () => {
    // Unmount cleanup
    if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }
    if (accuracyRef.current) { map.removeLayer(accuracyRef.current); accuracyRef.current = null; }
  }, [map]);

  return null;
};

const LiveMap = ({ position, activities, positions, filter, height = "500px" }: Props) => {
  const filtered = useMemo(
    () => activities.filter((a) => a.lat && a.lng && (!filter || a.category === filter)),
    [activities, filter]
  );

  const initialCenter: [number, number] = position
    ? [position.lat, position.lng]
    : filtered[0] ? [filtered[0].lat!, filtered[0].lng!]
    : [48.8566, 2.3522];

  const trail = positions.map((p) => [p.lat, p.lng]) as [number, number][];
  const allPoints: [number, number][] = [
    ...filtered.map((a) => [a.lat!, a.lng!] as [number, number]),
    ...(position ? [[position.lat, position.lng] as [number, number]] : []),
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-border" style={{ height }}>
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

        {trail.length > 1 ? (
          <Polyline positions={trail} pathOptions={{ color: "#06b6d4", weight: 4, opacity: 0.7 }} />
        ) : null}

        {filtered.map((a) => (
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
              <strong>{a.title}</strong>
              {a.description && <p className="text-xs mt-1">{a.description}</p>}
              <p className="text-xs text-muted-foreground capitalize mt-1">{a.status}</p>
            </Popup>
          </CircleMarker>
        ))}

        <StableUserMarker position={position} />
      </MapContainer>
    </div>
  );
};

export default LiveMap;
