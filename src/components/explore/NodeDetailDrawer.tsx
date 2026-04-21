import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sparkles, CheckCircle2, Camera, Trash2, Network } from "lucide-react";
import type { ExploreNode, ExploreEdge, ExploreMedia } from "@/hooks/useExplore";
import { TYPE_COLORS } from "@/lib/explore-badges";
import { useTranslation } from "react-i18next";

interface Props {
  node: ExploreNode | null;
  open: boolean;
  onClose: () => void;
  allNodes: ExploreNode[];
  edges: ExploreEdge[];
  media: ExploreMedia[];
  onVisit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddMedia: (id: string, p: { type: string; caption?: string; mood?: string }) => void;
  onSelectNode: (id: string) => void;
}

const NodeDetailDrawer = ({ node, open, onClose, allNodes, edges, media, onVisit, onDelete, onAddMedia, onSelectNode }: Props) => {
  const { t } = useTranslation();
  const [note, setNote] = useState("");

  if (!node) return null;

  const connected = edges
    .filter((e) => e.from_node_id === node.id || e.to_node_id === node.id)
    .map((e) => allNodes.find((n) => n.id === (e.from_node_id === node.id ? e.to_node_id : e.from_node_id)))
    .filter(Boolean) as ExploreNode[];

  const nodeMedia = media.filter((m) => m.node_id === node.id);
  const statusLabel = node.status === "visited" ? t("x2.visited") : node.status === "in_progress" ? t("x2.inProgress") : t("x2.todo");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS[node.type] }} />
            <span className="text-xs uppercase text-muted-foreground">{node.type}</span>
            <Badge variant={node.status === "visited" ? "default" : "outline"} className="ml-auto">
              {statusLabel}
            </Badge>
          </div>
          <SheetTitle className="text-2xl">{node.name}</SheetTitle>
          {node.description && <SheetDescription>{node.description}</SheetDescription>}
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <div className="text-lg font-bold text-foreground">+{node.points} pts</div>
              <div className="text-xs text-muted-foreground">{t("x2.level", { n: node.level })} • {node.source}</div>
            </div>
            {node.lat && node.lng && (
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {node.lat.toFixed(3)}, {node.lng.toFixed(3)}
              </div>
            )}
          </div>

          {node.status !== "visited" && (
            <Button onClick={() => onVisit(node.id)} className="w-full" size="lg">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t("x2.markVisited", { pts: node.points })}
            </Button>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-foreground">{t("x2.memoriesCount", { n: nodeMedia.length })}</h4>
            </div>
            {nodeMedia.length > 0 && (
              <div className="space-y-2 mb-3">
                {nodeMedia.map((m) => (
                  <div key={m.id} className="text-sm p-2 rounded-lg bg-muted/20">
                    {m.mood && <span className="mr-2">{m.mood}</span>}
                    {m.caption || <em className="text-muted-foreground">{t("x2.noCaption")}</em>}
                  </div>
                ))}
              </div>
            )}
            <Textarea
              placeholder={t("x2.addNote")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              disabled={!note.trim()}
              onClick={() => { onAddMedia(node.id, { type: "note", caption: note }); setNote(""); }}
            >
              {t("x2.addPlus20")}
            </Button>
          </div>

          {connected.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Network className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">{t("x2.connected", { n: connected.length })}</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {connected.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectNode(c.id)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted/30 hover:bg-primary/20 text-foreground transition"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { onDelete(node.id); onClose(); }}
            className="text-destructive hover:text-destructive w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("x2.deletePoint")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NodeDetailDrawer;
