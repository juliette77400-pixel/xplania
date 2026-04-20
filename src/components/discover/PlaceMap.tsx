import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { Place } from "@/hooks/useDiscover";
import { categoryByKey } from "@/lib/discover";

interface Props {
  places: Place[];
  userPos: { lat: number; lng: number } | null;
  onSelect: (p: Place) => void;
}

const buildIcon = (cat: string, hidden: boolean) => {
  const c = categoryByKey(cat);
  const color = c?.color || "hsl(190 90% 55%)";
  const size = hidden ? 38 : 32;
  return L.divIcon({
    className: "discover-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 14px ${color},0 0 24px ${color}55;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:${size * 0.55}px">${c?.emoji ?? "📍"}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const Cluster = ({ places, onSelect }: { places: Place[]; onSelect: (p: Place) => void }) => {
  const map = useMap();
  const groupRef = useRef<any>(null);
  useEffect(() => {
    // @ts-ignore
    const group = (L as any).markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
    places.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: buildIcon(p.category, p.hidden_gem) });
      m.bindPopup(`<div style="min-width:180px;font-family:inherit"><div style="font-weight:600">${p.name}</div>${p.why_fits ? `<div style="font-style:italic;font-size:12px;color:hsl(var(--muted-foreground));margin-top:4px">"${p.why_fits}"</div>` : ""}${p.distance_km != null ? `<div style="font-size:11px;margin-top:4px">📍 ${p.distance_km.toFixed(1)} km</div>` : ""}</div>`);
      m.on("click", () => onSelect(p));
      group.addLayer(m);
    });
    map.addLayer(group);
    groupRef.current = group;
    if (places.length) {
      const pts = places.map((p) => [p.lat, p.lng] as [number, number]);
      map.fitBounds(L.latLngBounds(pts).pad(0.2));
    }
    return () => { if (groupRef.current) map.removeLayer(groupRef.current); };
  }, [places, map, onSelect]);
  return null;
};

const UserDot = ({ pos }: { pos: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    const icon = L.divIcon({
      className: "user-dot",
      html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(190 95% 60%);box-shadow:0 0 0 6px hsl(190 95% 60% / 0.3),0 0 16px hsl(190 95% 60%);border:2px solid white"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9],
    });
    const m = L.marker([pos.lat, pos.lng], { icon }).addTo(map);
    return () => { map.removeLayer(m); };
  }, [pos, map]);
  return null;
};

const PlaceMap = ({ places, userPos, onSelect }: Props) => {
  const center: [number, number] = useMemo(() => userPos ? [userPos.lat, userPos.lng] : places[0] ? [places[0].lat, places[0].lng] : [48.8566, 2.3522], [userPos, places]);
  return (
    <div className="overflow-hidden rounded-2xl border border-border h-[60vh] min-h-[420px]">
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
        {userPos && <UserDot pos={userPos} />}
        <Cluster places={places} onSelect={onSelect} />
      </MapContainer>
    </div>
  );
};

export default PlaceMap;
