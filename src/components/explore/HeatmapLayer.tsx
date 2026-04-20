import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { ExploreNode } from "@/hooks/useExplore";

interface Props { nodes: ExploreNode[]; }

const HeatmapLayer = ({ nodes }: Props) => {
  const map = useMap();
  useEffect(() => {
    const pts = nodes.filter((n) => n.lat && n.lng).map((n) => {
      const intensity = n.status === "visited" ? 1.0 : n.status === "in_progress" ? 0.5 : 0.3;
      return [n.lat!, n.lng!, intensity] as [number, number, number];
    });
    if (pts.length === 0) return;
    // @ts-ignore
    const layer = L.heatLayer(pts, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: { 0.2: "#06b6d4", 0.5: "#a855f7", 0.8: "#ec4899", 1.0: "#f59e0b" },
    }).addTo(map);
    return () => { map.removeLayer(layer); };
  }, [nodes, map]);
  return null;
};

export default HeatmapLayer;
