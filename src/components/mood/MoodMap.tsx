import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { MoodPlace } from "@/hooks/useMoodExplorer";
import { moodByKey } from "@/lib/moods";

interface Props {
  places: MoodPlace[];
  onSelect?: (p: MoodPlace) => void;
  userPosition?: { lat: number; lng: number } | null;
}

const MOOD_COLOR: Record<string, string> = {
  chill: "hsl(190 90% 55%)",
  explore: "hsl(35 95% 55%)",
  romantic: "hsl(340 85% 60%)",
  food: "hsl(20 90% 55%)",
  party: "hsl(290 85% 60%)",
  nature: "hsl(155 70% 45%)",
  focus: "hsl(220 75% 60%)",
};

const buildIcon = (mood: string, hiddenGem: boolean) => {
  const color = MOOD_COLOR[mood] || "hsl(190 90% 55%)";
  const m = moodByKey(mood);
  const size = hiddenGem ? 38 : 32;
  return L.divIcon({
    className: "mood-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 16px ${color},0 0 28px ${color}55;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:${size * 0.55}px;">${m?.emoji || "✨"}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const ClusteredMarkers = ({ places, onSelect }: { places: MoodPlace[]; onSelect?: (p: MoodPlace) => void }) => {
  const map = useMap();
  const groupRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore - markerClusterGroup added by side-effect import
    const group = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
    });

    places
      .filter((p) => p.lat != null && p.lng != null)
      .forEach((p) => {
        const marker = L.marker([p.lat!, p.lng!], { icon: buildIcon(p.mood, p.hidden_gem) });
        const tagsHtml = (p.tags || []).slice(0, 3).map((t) => `<span style="font-size:10px;background:hsl(var(--primary)/0.2);padding:1px 6px;border-radius:8px;margin-right:3px;">#${t}</span>`).join("");
        marker.bindPopup(
          `<div style="min-width:200px;font-family:inherit;">
            <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${p.name}</div>
            <div style="font-style:italic;font-size:12px;color:hsl(var(--muted-foreground));margin-bottom:6px;">"${p.why_fits}"</div>
            <div style="margin-bottom:6px;">${tagsHtml}</div>
            ${p.distance_km != null ? `<div style="font-size:11px;color:hsl(var(--muted-foreground));">📍 ${p.distance_km.toFixed(1)} km</div>` : ""}
          </div>`,
        );
        marker.on("click", () => onSelect?.(p));
        group.addLayer(marker);
      });

    map.addLayer(group);
    groupRef.current = group;

    // Fit bounds
    const pts = places.filter((p) => p.lat != null && p.lng != null).map((p) => [p.lat!, p.lng!] as [number, number]);
    if (pts.length > 0) {
      map.fitBounds(L.latLngBounds(pts).pad(0.3));
    }

    return () => {
      if (groupRef.current) {
        map.removeLayer(groupRef.current);
        groupRef.current = null;
      }
    };
  }, [places, map, onSelect]);

  return null;
};

const UserMarker = ({ position }: { position: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    const icon = L.divIcon({
      className: "user-marker",
      html: `<div style="width:18px;height:18px;border-radius:50%;background:hsl(190 95% 60%);box-shadow:0 0 0 6px hsl(190 95% 60% / 0.3),0 0 16px hsl(190 95% 60%);border:2px solid white;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker([position.lat, position.lng], { icon }).addTo(map);
    return () => {
      map.removeLayer(marker);
    };
  }, [position, map]);
  return null;
};

const MoodMap = ({ places, onSelect, userPosition }: Props) => {
  const center: [number, number] = useMemo(() => {
    const geo = places.find((p) => p.lat != null && p.lng != null);
    if (geo) return [geo.lat!, geo.lng!];
    if (userPosition) return [userPosition.lat, userPosition.lng];
    return [48.8566, 2.3522];
  }, [places, userPosition]);

  const { t } = useTranslation();
  const hasGeo = places.some((p) => p.lat != null && p.lng != null);

  if (!hasGeo) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm h-[500px] flex items-center justify-center text-center px-6">
        <div className="space-y-2">
          <p className="text-2xl">🗺️</p>
          <p className="text-sm text-muted-foreground">{t("moodComp.map.noGeoTitle")}<br />{t("moodComp.map.noGeoDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-[500px] relative">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {userPosition && <UserMarker position={userPosition} />}
        <ClusteredMarkers places={places} onSelect={onSelect} />
      </MapContainer>
    </div>
  );
};

export default MoodMap;
