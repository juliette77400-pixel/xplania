import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ExploreNode } from "@/hooks/useExplore";

interface Suggestion { name: string; type: string; description: string; reason: string; }

interface Props {
  tripId: string;
  cityNode: ExploreNode | null;
  onAdd: (input: Partial<ExploreNode>) => void;
}

const SuggestionsPanel = ({ tripId, cityNode, onAdd }: Props) => {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("explore-suggest", { body: { tripId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setItems(data?.suggestions || []);
    } catch (e: any) {
      toast.error(e?.message || "Échec suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Suggestions IA
        </h3>
        <Button size="sm" variant="outline" onClick={fetchSuggestions} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Suggérer"}
        </Button>
      </div>
      {items.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">Lance l'IA pour découvrir des lieux locaux à ajouter à ton parcours.</p>
      )}
      <div className="space-y-2">
        {items.map((s, i) => (
          <div key={i} className="rounded-xl border border-border/60 p-3 bg-background/40">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-medium text-sm">{s.name}</div>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                onAdd({ name: s.name, type: s.type, description: s.description, parent_id: cityNode?.id || null, level: 2, points: 50 });
                setItems((prev) => prev.filter((_, idx) => idx !== i));
              }}>
                <Plus className="w-3 h-3 mr-1" /> Ajouter
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{s.description}</p>
            <p className="text-[11px] text-primary/80 italic">→ {s.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionsPanel;
