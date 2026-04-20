import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ExploreNode, ExploreEdge } from "@/hooks/useExplore";
import { TYPE_COLORS, STATUS_COLORS } from "@/lib/explore-badges";
import HeatmapLayer from "./HeatmapLayer";
import { Flame } from "lucide-react";

interface Props {
  nodes: ExploreNode[];
  edges: ExploreEdge[];
  onSelect: (nodeId: string) => void;
}

const makeIcon = (node: ExploreNode) => {
  const color = STATUS_COLORS[node.status] || TYPE_COLORS[node.type] || "hsl(190 90% 60%)";
  const size = node.level === 1 ? 22 : 16;
  return L.divIcon({
    className: "explore-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color},0 0 24px ${color};border:2px solid white;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const FitBounds = ({ nodes }: { nodes: ExploreNode[] }) => {
  const map = useMap();
  useEffect(() => {
    const pts = nodes.filter((n) => n.lat != null && n.lng != null).map((n) => [n.lat!, n.lng!] as [number, number]);
    if (pts.length > 0) {
      map.fitBounds(L.latLngBounds(pts).pad(0.3));
    }
  }, [nodes, map]);
  return null;
};

const ExploreMap = ({ nodes, edges, onSelect }: Props) => {
  const geoNodes = useMemo(() => nodes.filter((n) => n.lat != null && n.lng != null), [nodes]);
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [heatmap, setHeatmap] = useState(false);

  const center: [number, number] = geoNodes.length > 0
    ? [geoNodes[0].lat!, geoNodes[0].lng!]
    : [48.8566, 2.3522];

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-[500px] relative">
      <button
        onClick={() => setHeatmap((v) => !v)}
        className={`absolute top-3 right-3 z-[400] px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md flex items-center gap-1.5 transition ${heatmap ? "bg-primary text-primary-foreground border-primary" : "bg-background/80 text-foreground border-border"}`}
      >
        <Flame className="w-3 h-3" /> Heatmap
      </button>
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%", background: "hsl(220 30% 8%)" }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OSM &copy; CARTO'
        />
        <FitBounds nodes={geoNodes} />
        {heatmap && <HeatmapLayer nodes={geoNodes} />}
        {edges.map((e) => {
          const a = nodeMap.get(e.from_node_id);
          const b = nodeMap.get(e.to_node_id);
          if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
          return (
            <Polyline
              key={e.id}
              positions={[[a.lat, a.lng], [b.lat, b.lng]]}
              pathOptions={{
                color: e.edge_type === "geographic" ? "hsl(190 90% 60%)" : "hsl(280 80% 65%)",
                weight: 2,
                opacity: 0.5,
                dashArray: e.edge_type === "logical" ? "4 6" : undefined,
              }}
            />
          );
        })}
        {geoNodes.map((n) => (
          <Marker key={n.id} position={[n.lat!, n.lng!]} icon={makeIcon(n)} eventHandlers={{ click: () => onSelect(n.id) }}>
            <Popup>
              <div className="text-sm">
                <strong>{n.name}</strong><br />
                <span className="text-xs">+{n.points}pts • {n.status}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {geoNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground text-center px-6">
            Aucun point géolocalisé.<br />Utilise la vue Mind-map pour explorer la ramification.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExploreMap;
