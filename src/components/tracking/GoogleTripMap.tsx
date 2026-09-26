/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TripActivity } from "@/hooks/useTracking";
import type { Position } from "@/hooks/useGeolocation";
import { loadGoogleMaps, XPLANIA_MAP_STYLE } from "@/lib/google-maps-loader";
import { checkpointLabel, orderedStops, samplePoints } from "@/lib/route-distance";

const LeafletMap = lazy(() => import("./LiveMap"));

const STATUS_COLOR = { todo: "#94a3b8", in_progress: "#f59e0b", done: "#10b981" } as const;

interface Props {
  position: Position | null;
  activities: TripActivity[];
  positions: { lat: number; lng: number }[];
  height?: number;
}

/**
 * Google Maps view of the live trip (dark Xplania style):
 * - lettered checkpoints A, B, C… for every recorded geolocation (the real path)
 * - numbered planned stops coloured by status, linked by a dashed line
 * Falls back to the free map when Google Maps can't load (e.g. custom domain).
 */
const GoogleTripMap = ({ position, activities, positions, height = 440 }: Props) => {
  const { t } = useTranslation();
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const onFail = () => setFailed(true);
    window.addEventListener("gmaps-auth-failure", onFail);
    loadGoogleMaps()
      .then((gm) => {
        if (!alive || !el.current) return;
        mapRef.current = new gm.Map(el.current, {
          center: position ? { lat: position.lat, lng: position.lng } : { lat: 48.8566, lng: 2.3522 },
          zoom: 13,
          styles: XPLANIA_MAP_STYLE,
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy",
          backgroundColor: "#0f1629",
        });
        setReady(true);
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; window.removeEventListener("gmaps-auth-failure", onFail); };
    // map is created once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stops = useMemo(() => orderedStops(activities), [activities]);
  const checkpoints = useMemo(() => {
    const pts = [...positions];
    if (position) pts.push({ lat: position.lat, lng: position.lng });
    return samplePoints(pts, 26);
  }, [positions, position]);

  useEffect(() => {
    const gm = (window as any).google?.maps;
    const map = mapRef.current;
    if (!ready || !gm || !map) return;
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    const info = new gm.InfoWindow();
    const bounds = new gm.LatLngBounds();

    if (checkpoints.length > 1) {
      overlays.current.push(new gm.Polyline({ map, path: checkpoints, strokeColor: "#22d3ee", strokeOpacity: 0.9, strokeWeight: 4 }));
    }
    checkpoints.forEach((p, i) => {
      const isLast = i === checkpoints.length - 1;
      const m = new gm.Marker({
        map, position: p, zIndex: isLast ? 1000 : 500 + i,
        label: { text: checkpointLabel(i), color: "#0b1120", fontSize: "10px", fontWeight: "700" },
        icon: { path: gm.SymbolPath.CIRCLE, scale: isLast ? 11 : 8, fillColor: isLast ? "#3b82f6" : "#22d3ee", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
        title: isLast ? t("gmaps.map.youAreHere") : t("gmaps.map.checkpoint", { label: checkpointLabel(i) }),
      });
      overlays.current.push(m);
      bounds.extend(p);
    });

    if (stops.length > 1) {
      overlays.current.push(new gm.Polyline({
        map, path: stops.map((s) => ({ lat: s.lat!, lng: s.lng! })), strokeOpacity: 0,
        icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, strokeColor: "#a855f7", scale: 3 }, offset: "0", repeat: "14px" }],
      }));
    }
    stops.forEach((s, i) => {
      const m = new gm.Marker({
        map, position: { lat: s.lat!, lng: s.lng! },
        label: { text: String(i + 1), color: "#ffffff", fontSize: "11px", fontWeight: "700" },
        icon: { path: gm.SymbolPath.CIRCLE, scale: 12, fillColor: STATUS_COLOR[s.status] ?? "#a855f7", fillOpacity: 1, strokeColor: "#0b1120", strokeWeight: 2 },
        title: s.title,
      });
      m.addListener("click", () => {
        const div = document.createElement("div");
        div.style.color = "#0b1120";
        const b = document.createElement("strong");
        b.textContent = `${i + 1}. ${s.title}`;
        div.appendChild(b);
        if (s.description) { const p = document.createElement("p"); p.textContent = s.description; p.style.fontSize = "12px"; div.appendChild(p); }
        info.setContent(div);
        info.open({ map, anchor: m });
      });
      overlays.current.push(m);
      bounds.extend({ lat: s.lat!, lng: s.lng! });
    });

    if (!fitted.current && !bounds.isEmpty()) {
      fitted.current = true;
      map.fitBounds(bounds, 48);
      gm.event.addListenerOnce(map, "idle", () => { if (map.getZoom() > 15) map.setZoom(15); });
    }
  }, [ready, checkpoints, stops, t]);

  if (failed) {
    return (
      <Suspense fallback={<div className="rounded-2xl border border-border bg-card/40" style={{ height }} />}>
        <LeafletMap position={position} activities={activities} positions={positions} height={`${height}px`} />
      </Suspense>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border shadow-lg" style={{ height }}>
      <div ref={el} className="h-full w-full" />
      {!ready && <div className="absolute inset-0 grid place-items-center bg-card/60 text-sm text-muted-foreground">{t("gmaps.map.loading")}</div>}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-xl bg-background/80 px-3 py-2 text-xs backdrop-blur-md">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />{t("gmaps.map.legendPath")}</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" />{t("gmaps.map.legendPlanned")}</span>
      </div>
    </div>
  );
};

export default GoogleTripMap;
