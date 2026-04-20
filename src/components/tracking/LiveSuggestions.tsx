import { useState } from "react";
import { Sparkles, Loader2, Utensils, Mountain, Building2, ShoppingBag, Moon, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Position } from "@/hooks/useGeolocation";
import { toast } from "sonner";

interface Suggestion {
  title: string;
  category: string;
  description: string;
  reason: string;
  estimated_duration?: string;
}

const icons: Record<string, any> = {
  food: Utensils, culture: Building2, nature: Mountain,
  shopping: ShoppingBag, nightlife: Moon, hidden_gem: Gem,
};

interface Props {
  position: Position | null;
  destination?: string;
  weather?: string;
}

const LiveSuggestions = ({ position, destination, weather }: Props) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState("");

  const fetchSuggestions = async () => {
    if (!position) {
      toast.error("Active la géolocalisation d'abord");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("trip-suggestions", {
      body: { lat: position.lat, lng: position.lng, destination, weather, mood },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Erreur");
      return;
    }
    setSuggestions(data?.suggestions || []);
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Suggestions IA
        </h3>
        <Button onClick={fetchSuggestions} disabled={loading || !position} size="sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suggérer maintenant"}
        </Button>
      </div>

      <input
        type="text"
        placeholder="Humeur du moment (facultatif) — ex: tranquille, gourmand..."
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg bg-muted/30 border border-border focus:outline-none focus:border-primary"
      />

      <div className="space-y-2">
        {suggestions.map((s, i) => {
          const Icon = icons[s.category] || Sparkles;
          return (
            <div key={i} className="rounded-xl p-3 bg-muted/20 border border-border">
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  <p className="text-xs text-primary/80 mt-1 italic">→ {s.reason}</p>
                </div>
              </div>
            </div>
          );
        })}
        {suggestions.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Active le suivi puis clique sur "Suggérer maintenant" pour des idées hyper locales.
          </p>
        )}
      </div>
    </div>
  );
};

export default LiveSuggestions;
