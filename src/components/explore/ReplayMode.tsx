import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { ExploreNode, ExploreEdge } from "@/hooks/useExplore";
import { TYPE_COLORS } from "@/lib/explore-badges";

interface Props { nodes: ExploreNode[]; edges: ExploreEdge[]; }

const FitAll = ({ nodes }: { nodes: ExploreNode[] }) => {
  const map = useMap();
  useEffect(() => {
    const pts = nodes.filter((n) => n.lat && n.lng).map((n) => [n.lat!, n.lng!] as [number, number]);
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.3));
  }, [nodes, map]);
  return null;
};

const ReplayMode = ({ nodes, edges }: Props) => {
  const visitedSorted = useMemo(
    () => nodes.filter((n) => n.status === "visited" && n.lat && n.lng && n.visited_at)
      .sort((a, b) => new Date(a.visited_at!).getTime() - new Date(b.visited_at!).getTime()),
    [nodes]
  );

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const total = visitedSorted.length;

  useEffect(() => {
    if (!playing || step >= total) return;
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, total)), 1200);
    return () => clearTimeout(t);
  }, [playing, step, total]);

  useEffect(() => { if (step >= total) setPlaying(false); }, [step, total]);

  const visibleNodes = visitedSorted.slice(0, step);
  const path: [number, number][] = visibleNodes.map((n) => [n.lat!, n.lng!]);
  const center: [number, number] = visitedSorted[0] ? [visitedSorted[0].lat!, visitedSorted[0].lng!] : [48.8566, 2.3522];

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">Visite des lieux pour rejouer ton parcours animé ✨</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden border border-border h-[480px] relative">
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%", background: "hsl(220 30% 8%)" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OSM &copy; CARTO" />
          <FitAll nodes={visitedSorted} />
          {path.length > 1 && (
            <Polyline positions={path} pathOptions={{ color: "hsl(190 90% 60%)", weight: 3, opacity: 0.85 }} />
          )}
          {visibleNodes.map((n, i) => (
            <CircleMarker
              key={n.id}
              center={[n.lat!, n.lng!]}
              radius={i === visibleNodes.length - 1 ? 12 : 7}
              pathOptions={{
                color: "white",
                weight: 2,
                fillColor: TYPE_COLORS[n.type] || "hsl(190 90% 60%)",
                fillOpacity: 0.9,
              }}
            />
          ))}
        </MapContainer>
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border text-xs font-medium">
          Étape {step}/{total} {visibleNodes[visibleNodes.length - 1]?.name && `• ${visibleNodes[visibleNodes.length - 1].name}`}
        </div>
      </div>

      <div className="flex items-center gap-3 px-2">
        <Button size="icon" variant="outline" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button size="icon" onClick={() => { if (step >= total) setStep(0); setPlaying((p) => !p); }}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Slider
          value={[step]}
          min={0}
          max={total}
          step={1}
          onValueChange={([v]) => { setStep(v); setPlaying(false); }}
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default ReplayMode;
