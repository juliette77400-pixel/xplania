import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { invokeProtectedFunction } from "@/lib/protected-functions";
import { distanceKm } from "@/lib/discover";
import type { Place } from "@/hooks/useDiscover";
import { searchPhoton, type GeoSuggestion } from "@/lib/geocoding";
import { toast } from "sonner";
import PlaceCard from "./PlaceCard";
import { useTranslation } from "react-i18next";

interface Props {
  userPos: { lat: number; lng: number } | null;
  onSelect: (p: Place) => void;
}

const SmartSearch = ({ userPos, onSelect }: Props) => {
  const { t } = useTranslation();
  const SUGGESTIONS = [
    t("discoverComp.search.suggestion1"),
    t("discoverComp.search.suggestion2"),
    t("discoverComp.search.suggestion3"),
    t("discoverComp.search.suggestion4"),
    t("discoverComp.search.suggestion5"),
    t("discoverComp.search.suggestion6"),
  ];
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [autocomplete, setAutocomplete] = useState<GeoSuggestion[]>([]);
  const [showAuto, setShowAuto] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Google-Maps-like autocomplete via Photon
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setAutocomplete([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      const results = await searchPhoton(q, { lat: userPos?.lat, lng: userPos?.lng, limit: 5 });
      setAutocomplete(results);
    }, 250);
  }, [q, userPos?.lat, userPos?.lng]);

  const run = async (text: string) => {
    if (!text.trim()) return;
    setShowAuto(false);
    setLoading(true);
    try {
      const { data, error } = await invokeProtectedFunction<{ places: Place[] }>("discover-search", {
        body: { query: text, lat: userPos?.lat, lng: userPos?.lng, radius: 4000 },
      });
      if (error) throw error;
      const places = (data?.places || []) as Place[];
      const withDist = userPos ? places.map((p) => ({ ...p, distance_km: distanceKm(userPos, { lat: p.lat, lng: p.lng }) })) : places;
      setResults(withDist);
      if (withDist.length === 0) toast.info(t("discoverComp.search.empty"));
    } catch (e: any) {
      toast.error(e?.message || t("discoverComp.search.fail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setShowAuto(true); }}
            onFocus={() => setShowAuto(true)}
            onBlur={() => setTimeout(() => setShowAuto(false), 200)}
            placeholder={t("discoverComp.search.placeholder")}
            className="pl-9"
          />
          {showAuto && autocomplete.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              {autocomplete.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setQ(s.label); setShowAuto(false); run(s.label); }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 border-b border-border last:border-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{s.name || s.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[s.city, s.country].filter(Boolean).join(", ")}
                      {s.type && <span className="ml-1 text-primary/70">· {s.type}</span>}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" disabled={loading || !q.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("discoverComp.search.submit")}
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
