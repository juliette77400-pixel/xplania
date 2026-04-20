import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { distanceKm } from "@/lib/discover";
import type { Place } from "@/hooks/useDiscover";
import { toast } from "sonner";
import PlaceCard from "./PlaceCard";

interface Props {
  userPos: { lat: number; lng: number } | null;
  onSelect: (p: Place) => void;
}

const SUGGESTIONS = ["brunch avec vue", "café calme pour travailler", "restaurant local pas touristique", "spot sunset", "balade nature", "sortie soir authentique"];

const SmartSearch = ({ userPos, onSelect }: Props) => {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Place[]>([]);

  const run = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-search", {
        body: { query: text, lat: userPos?.lat, lng: userPos?.lng, radius: 4000 },
      });
      if (error) throw error;
      const places = (data?.places || []) as Place[];
      const withDist = userPos ? places.map((p) => ({ ...p, distance_km: distanceKm(userPos, { lat: p.lat, lng: p.lng }) })) : places;
      setResults(withDist);
      if (withDist.length === 0) toast.info("Aucun lieu trouvé. Essaie ailleurs ou rafraîchis 'Pour toi'.");
    } catch (e: any) {
      toast.error(e?.message || "Recherche échouée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Décris ce que tu cherches… (ex: brunch avec vue)" className="pl-9" />
        </div>
        <Button type="submit" disabled={loading || !q.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Chercher"}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => { setQ(s); run(s); }} className="rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground">
            {s}
          </button>
        ))}
      </div>
      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => <PlaceCard key={p.id} place={p} onClick={() => onSelect(p)} />)}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
