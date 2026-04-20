import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node as RFNode,
  type Edge as RFEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import type { ExploreNode, ExploreEdge } from "@/hooks/useExplore";
import { TYPE_COLORS, STATUS_COLORS } from "@/lib/explore-badges";

interface Props {
  nodes: ExploreNode[];
  edges: ExploreEdge[];
  onSelect: (nodeId: string) => void;
}

const layout = (rfNodes: RFNode[], rfEdges: RFEdge[]) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 100 });
  rfNodes.forEach((n) => g.setNode(n.id, { width: 180, height: 70 }));
  rfEdges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return rfNodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - 90, y: p.y - 35 } };
  });
};

const ExploreMindMap = ({ nodes, edges, onSelect }: Props) => {
  const rfNodes: RFNode[] = useMemo(
    () =>
      nodes.map((n) => {
        const color = STATUS_COLORS[n.status] || TYPE_COLORS[n.type] || "hsl(190 90% 60%)";
        return {
          id: n.id,
          type: "default",
          data: {
            label: (
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-xs font-bold text-foreground">{n.name}</span>
                <span className="text-[9px] text-muted-foreground uppercase">{n.type} • +{n.points}pts</span>
              </div>
            ) as any,
          },
          position: { x: 0, y: 0 },
          style: {
            background: "hsl(var(--card))",
            border: `2px solid ${color}`,
            borderRadius: 12,
            boxShadow: n.status === "visited" ? `0 0 20px ${color}` : "none",
            padding: 8,
            width: 180,
            color: "hsl(var(--foreground))",
          },
        };
      }),
    [nodes]
  );

  const rfEdges: RFEdge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.from_node_id,
        target: e.to_node_id,
        animated: e.edge_type === "geographic",
        style: {
          stroke: e.edge_type === "geographic" ? "hsl(190 90% 60%)" : "hsl(280 80% 65%)",
          strokeWidth: 1.5,
          opacity: 0.6,
        },
      })),
    [edges]
  );

  const laidOut = useMemo(() => layout(rfNodes, rfEdges), [rfNodes, rfEdges]);
  const [n, setN, onNodesChange] = useNodesState(laidOut);
  const [e, setE, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => { setN(laidOut); }, [laidOut, setN]);
  useEffect(() => { setE(rfEdges); }, [rfEdges, setE]);

  const handleClick = useCallback((_: any, node: RFNode) => onSelect(node.id), [onSelect]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-[500px] bg-background">
      <ReactFlow
        nodes={n}
        edges={e}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--border))" gap={24} />
        <Controls className="!bg-card !border-border" />
        <MiniMap
          nodeColor={(node) => {
            const en = nodes.find((x) => x.id === node.id);
            return STATUS_COLORS[en?.status || "planned"];
          }}
          maskColor="hsl(220 30% 8% / 0.6)"
          className="!bg-card !border-border"
        />
      </ReactFlow>
    </div>
  );
};

export default ExploreMindMap;
