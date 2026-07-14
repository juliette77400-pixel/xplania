import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Navigation, Sparkles, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripActivity } from "@/hooks/useTracking";
import { Position } from "@/hooks/useGeolocation";
import { NearbyPOI, POI_COLORS, POI_LABELS } from "@/hooks/useNearbyPOI";

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

const statusColor = { todo: "hsl(220 10% 65%)", in_progress: "hsl(38 92% 55%)", done: "hsl(160 70% 45%)" };

/**
 * Stylised, flicker-free "simulated" live map.
 * Uses a static SVG-based dark grid background with an animated pulsing pin
 * for the user's current position. Designed as a reliable fallback to Leaflet
 * for the Suivi Live tab where re-renders were causing flicker.
 */
const SimulatedLiveMap = ({
  position,
  activities,
  positions,
  filter,
  height = "500px",
  pois = [],
  onPoiAddToCarnet,
  aiPins = [],
  onAiPinAddToCarnet,
}: Props) => {
  const filtered = useMemo(
    () => activities.filter((a) => a.lat && a.lng && (!filter || a.category === filter)),
    [activities, filter],
  );

  // Compute bounds from all geo points to project them on the canvas.
  const allPoints = useMemo(() => {
    const pts: { lat: number; lng: number }[] = [];
    if (position) pts.push({ lat: position.lat, lng: position.lng });
    filtered.forEach((a) => pts.push({ lat: a.lat!, lng: a.lng! }));
    pois.forEach((p) => pts.push({ lat: p.lat, lng: p.lng }));
    aiPins.forEach((p) => pts.push({ lat: p.lat, lng: p.lng }));
    positions.forEach((p) => pts.push({ lat: p.lat, lng: p.lng }));
    return pts;
  }, [position, filtered, pois, aiPins, positions]);

  const bounds = useMemo(() => {
    if (allPoints.length === 0) {
      // Default Paris-ish bounds
      return { minLat: 48.82, maxLat: 48.89, minLng: 2.27, maxLng: 2.41 };
    }
    const lats = allPoints.map((p) => p.lat);
    const lngs = allPoints.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = Math.max((maxLat - minLat) * 0.25, 0.005);
    const padLng = Math.max((maxLng - minLng) * 0.25, 0.005);
    return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLng: minLng - padLng, maxLng: maxLng + padLng };
  }, [allPoints]);

  const project = useCallback(
    (lat: number, lng: number) => {
      const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
      const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
      return { x, y };
    },
    [bounds],
  );

  const userPos = position ? project(position.lat, position.lng) : null;

  // Trail polyline points (recorded GPS)
  const trailPath = useMemo(() => {
    if (positions.length < 2) return "";
    return positions
      .map((p) => {
        const { x, y } = project(p.lat, p.lng);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [positions, project]);

  // Planned route (ordered)
  const orderedRoute = useMemo(() => {
    const ordered = [...filtered].sort((x, y) => {
      const d = (x.day_date || "").localeCompare(y.day_date || "");
      return d !== 0 ? d : x.position - y.position;
    });
    return ordered;
  }, [filtered]);

  const routePath = useMemo(() => {
    if (orderedRoute.length < 2) return "";
    return orderedRoute
      .map((a) => {
        const { x, y } = project(a.lat!, a.lng!);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [orderedRoute, project]);

  const openExternal = (provider: "gmaps" | "osm") => {
    if (!position) return;
    const { lat, lng } = position;
    const url =
      provider === "gmaps"
        ? `https://www.google.com/maps?q=${lat},${lng}`
        : `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-[hsl(220_40%_8%)] via-[hsl(225_35%_10%)] to-[hsl(230_40%_6%)]"
      style={{ height }}
    >
      {/* Stylised background: subtle grid + radial glow */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="sim-grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="hsl(190 90% 60% / 0.06)" strokeWidth="0.15" />
          </pattern>
          <radialGradient id="sim-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="hsl(190 90% 60% / 0.18)" />
            <stop offset="60%" stopColor="hsl(280 80% 55% / 0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#sim-grid)" />
        <rect width="100" height="100" fill="url(#sim-glow)" />
      </svg>

      {/* Decorative compass label */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-md border border-border text-[10px] uppercase tracking-wider text-muted-foreground">
        <MapPin className="w-3 h-3 text-primary" /> Live preview
      </div>

      {/* SVG layer for paths + points (uses % coords) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Recorded trail (cyan dashed-anim) */}
        {trailPath && (
          <polyline
            points={trailPath}
            fill="none"
            stroke="hsl(190 90% 60%)"
            strokeWidth="0.6"
            strokeOpacity="0.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 1.5px hsl(190 90% 60%))" }}
          />
        )}

        {/* Planned route (purple dashed) */}
        {routePath && (
          <polyline
            points={routePath}
            fill="none"
            stroke="hsl(280 80% 65%)"
            strokeWidth="0.5"
            strokeOpacity="0.7"
            strokeDasharray="1.2 1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Activity stops */}
        {filtered.map((a) => {
          const { x, y } = project(a.lat!, a.lng!);
          return (
            <circle
              key={a.id}
              cx={x}
              cy={y}
              r="1.1"
              fill={statusColor[a.status]}
              stroke="hsl(0 0% 100%)"
              strokeWidth="0.25"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* OSM POI dots */}
        {pois.map((p) => {
          const { x, y } = project(p.lat, p.lng);
          return (
            <circle
              key={`poi-${p.id}`}
              cx={x}
              cy={y}
              r="0.7"
              fill={POI_COLORS[p.category]}
              stroke="hsl(0 0% 100%)"
              strokeWidth="0.18"
              opacity="0.95"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* AI pins (golden) */}
        {aiPins.map((p, i) => {
          const { x, y } = project(p.lat, p.lng);
          return (
            <g key={`ai-${i}`}>
              <circle
                cx={x}
                cy={y}
                r="1.1"
                fill="hsl(38 92% 55%)"
                stroke="hsl(45 93% 70%)"
                strokeWidth="0.3"
                strokeDasharray="0.4 0.4"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      {/* Animated user pin (DOM, not SVG, so framer-motion can pulse smoothly) */}
      {userPos && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${userPos.x}%`,
            top: `${userPos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Accuracy halo */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              width: 60,
              height: 60,
              left: -30,
              top: -30,
              background: "radial-gradient(circle, hsl(190 90% 60% / 0.25) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Pulse ring */}
          <motion.span
            className="absolute rounded-full border-2 border-primary"
            style={{ width: 22, height: 22, left: -11, top: -11 }}
            animate={{ scale: [1, 2.2, 1], opacity: [0.9, 0, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          {/* Core dot */}
          <span
            className="block w-3 h-3 rounded-full bg-primary border-2 border-background shadow-[0_0_12px_hsl(var(--primary))]"
          />
        </div>
      )}

      {/* Pin labels (ai + activity) — DOM-positioned for legibility */}
      {filtered.map((a) => {
        const { x, y } = project(a.lat!, a.lng!);
        return (
          <div
            key={`lbl-${a.id}`}
            className="absolute z-10 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-sm text-[9px] font-medium text-foreground whitespace-nowrap pointer-events-none border border-border/60"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -150%)" }}
            title={a.title}
          >
            {a.title.length > 18 ? a.title.slice(0, 16) + "…" : a.title}
          </div>
        );
      })}

      {aiPins.map((p, i) => {
        const { x, y } = project(p.lat, p.lng);
        return (
          <button
            key={`ai-lbl-${i}`}
            onClick={() => onAiPinAddToCarnet?.(p)}
            className="absolute z-10 px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/35 transition-colors text-[9px] font-semibold text-amber-200 whitespace-nowrap border border-amber-500/40"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, 150%)" }}
            title={`${p.title} — ${p.reason || ""}`}
          >
            <Sparkles className="inline w-2.5 h-2.5 mr-0.5" />
            {p.title.length > 16 ? p.title.slice(0, 14) + "…" : p.title}
          </button>
        );
      })}

      {pois.slice(0, 8).map((p) => {
        const { x, y } = project(p.lat, p.lng);
        return (
          <button
            key={`poi-lbl-${p.id}`}
            onClick={() => onPoiAddToCarnet?.(p)}
            className="absolute z-10 px-1 py-0.5 rounded text-[8px] font-medium whitespace-nowrap border"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, 150%)",
              background: POI_COLORS[p.category] + "33",
              color: POI_COLORS[p.category],
              borderColor: POI_COLORS[p.category] + "66",
            }}
            title={`${p.name} — ${POI_LABELS[p.category]}`}
          >
            {p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name}
          </button>
        );
      })}

      {/* Floating actions */}
      {position && (
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
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
        <div className="absolute bottom-3 left-3 z-30 text-xs px-2.5 py-1.5 rounded-md bg-warning text-warning-foreground shadow-lg">
          📍 Position approximative (IP) — active le GPS pour une position précise
        </div>
      )}

      {!position && allPoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted-foreground p-6">
          Active le suivi pour voir ta position et tes étapes en temps réel.
        </div>
      )}
    </div>
  );
};

export default SimulatedLiveMap;
