import { useState } from "react";
import { Sparkles, Loader2, Utensils, Mountain, Building2, ShoppingBag, Moon, Gem, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Position } from "@/hooks/useGeolocation";
import { toast } from "sonner";

export interface AISuggestion {
  title: string;
  category: string;
  description: string;
  reason: string;
  estimated_duration?: string;
  lat?: number;
  lng?: number;
}

const icons: Record<string, any> = {
  food: Utensils, culture: Building2, nature: Mountain,
  shopping: ShoppingBag, nightlife: Moon, hidden_gem: Gem,
};

interface Props {
  position: Position | null;
  destination?: string;
  weather?: string;
  suggestions: AISuggestion[];
  onSuggestions: (s: AISuggestion[]) => void;
  onAddToCarnet?: (s: AISuggestion) => void;
}

const LiveSuggestions = ({ position, destination, weather, suggestions, onSuggestions, onAddToCarnet }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState("");

  const fetchSuggestions = async () => {
    if (!position) {
      toast.error(t("trackingComp.suggestions.geoNeeded"));
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("trip-suggestions", {
      body: { lat: position.lat, lng: position.lng, destination, weather, mood },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || t("trackingComp.suggestions.error"));
      return;
    }
    onSuggestions(data?.suggestions || []);
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> {t("trackingComp.suggestions.title")}
          {weather && <span className="text-xs font-normal text-muted-foreground">· {weather}</span>}
        </h3>
        <Button onClick={fetchSuggestions} disabled={loading || !position} size="sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("trackingComp.suggestions.suggestNow")}
        </Button>
      </div>

      <input
        type="text"
        placeholder={t("trackingComp.suggestions.moodPh")}
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
                  <div className="flex items-center gap-3 mt-2">
                    {s.lat && s.lng && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {t("trackingComp.suggestions.pinOnMap")}
                      </span>
                    )}
                    {onAddToCarnet && (
                      <button
                        onClick={() => onAddToCarnet(s)}
                        className="text-[11px] text-primary hover:underline ml-auto"
                      >
                        {t("trackingComp.suggestions.addToCarnet")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {suggestions.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {t("trackingComp.suggestions.empty")}
          </p>
        )}
      </div>
    </div>
  );
};

export default LiveSuggestions;
