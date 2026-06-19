import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Locate } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Place } from "@/hooks/useDiscover";
import { categoryByKey } from "@/lib/discover";

interface Props {
  places: Place[];
  userPos: { lat: number; lng: number } | null;
  onSelect: (p: Place) => void;
}

const fmtDist = (km?: number) => {
  if (km == null) return "";
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

const buildIcon = (cat: string, hidden: boolean, distance?: number) => {
  const c = categoryByKey(cat);
  const color = c?.color || "hsl(190 90% 55%)";
  const size = hidden ? 38 : 32;
  const dist = fmtDist(distance);
  return L.divIcon({
    className: "discover-marker",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px)">
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 14px ${color},0 0 24px ${color}55;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:${size * 0.55}px">${c?.emoji ?? "📍"}</div>
        ${dist ? `<div style="margin-top:2px;padding:1px 6px;font-size:10px;font-weight:600;color:white;background:rgba(15,23,42,0.85);border-radius:9999px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.4)">${dist}</div>` : ""}
      </div>`,
    iconSize: [size, size + (dist ? 16 : 0)],
    iconAnchor: [size / 2, size / 2],
  });
};

const Cluster = ({ places, onSelect }: { places: Place[]; onSelect: (p: Place) => void }) => {
  const map = useMap();
  const groupRef = useRef<any>(null);
  const didFitRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    // @ts-ignore
    const group = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
    });
    places.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: buildIcon(p.category, p.hidden_gem, p.distance_km) });
      m.bindPopup(
        `<div style="min-width:180px;font-family:inherit"><div style="font-weight:600">${p.name}</div>${p.why_fits ? `<div style="font-style:italic;font-size:12px;color:hsl(var(--muted-foreground));margin-top:4px">"${p.why_fits}"</div>` : ""}${p.distance_km != null ? `<div style="font-size:11px;margin-top:4px">📍 ${fmtDist(p.distance_km)}</div>` : ""}</div>`,
      );
      m.on("click", () => onSelectRef.current(p));
      group.addLayer(m);
    });
    map.addLayer(group);
    groupRef.current = group;

    // Only auto-fit once, on initial non-empty render. Filter changes won't pan/zoom.
    if (!didFitRef.current && places.length) {
      const pts = places.map((p) => [p.lat, p.lng] as [number, number]);
      try {
        map.fitBounds(L.latLngBounds(pts).pad(0.25), { animate: false });
        didFitRef.current = true;
      } catch {
        /* noop */
      }
    }

    return () => {
      if (groupRef.current) map.removeLayer(groupRef.current);
    };
  }, [places, map]);

  return null;
};

const UserDot = ({ pos }: { pos: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    const icon = L.divIcon({
      className: "user-dot",
      html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(190 95% 60%);box-shadow:0 0 0 6px hsl(190 95% 60% / 0.3),0 0 16px hsl(190 95% 60%);border:2px solid white"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const m = L.marker([pos.lat, pos.lng], { icon, zIndexOffset: 1000 }).addTo(map);
    return () => {
      map.removeLayer(m);
    };
  }, [pos.lat, pos.lng, map]);
  return null;
};

const RecenterButton = ({ userPos }: { userPos: { lat: number; lng: number } | null }) => {
  const map = useMap();
  const { t } = useTranslation();
  if (!userPos) return null;
  return (
    <button
      type="button"
      onClick={() => map.flyTo([userPos.lat, userPos.lng], Math.max(map.getZoom(), 15), { duration: 0.6 })}
      className="absolute bottom-4 right-4 z-[400] grid h-11 w-11 place-items-center rounded-full border border-border bg-card/95 text-foreground shadow-lg backdrop-blur hover:bg-card"
      aria-label={t("discoverMap.recenter")}
      title={t("discoverMap.recenter")}
    >
      <Locate className="h-5 w-5" />
    </button>
  );
};

const PlaceMap = ({ places, userPos, onSelect }: Props) => {
  const center: [number, number] = useMemo(
    () =>
      userPos
        ? [userPos.lat, userPos.lng]
        : places[0]
        ? [places[0].lat, places[0].lng]
        : [48.8566, 2.3522],
    // center is only used for the very first mount; ignore later changes to avoid flicker
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border h-[65vh] min-h-[440px]">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        zoomControl
        preferCanvas
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap, &copy; CARTO"
        />
        {userPos && <UserDot pos={userPos} />}
        <Cluster places={places} onSelect={onSelect} />
        <RecenterButton userPos={userPos} />
      </MapContainer>
    </div>
  );
};

export default PlaceMap;
