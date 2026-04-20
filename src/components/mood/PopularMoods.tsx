import { TrendingUp, MapPin } from "lucide-react";
import { usePopularMoods } from "@/hooks/useMoodSocial";
import { moodByKey } from "@/lib/moods";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  onSelectMood?: (mood: string) => void;
}

const PopularMoods = ({ onSelectMood }: Props) => {
  const { popular, recent, loading } = usePopularMoods();

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-6">Chargement…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Moods populaires (7 jours)</h3>
        </div>
        {popular.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Aucun ressenti partagé pour le moment.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {popular.map(({ mood, count }) => {
              const m = moodByKey(mood);
              return (
                <button
                  key={mood}
                  onClick={() => onSelectMood?.(mood)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all"
                >
                  <span className="text-lg">{m?.emoji || "✨"}</span>
                  <span className="text-sm font-medium">{m?.label || mood}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Derniers ressentis partagés</h3>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Aucune activité récente.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => {
              const m = moodByKey(r.mood);
              return (
                <div key={r.id} className="rounded-lg border border-border bg-card/40 p-2.5 text-sm flex gap-2">
                  <span className="text-2xl shrink-0">{r.emoji || m?.emoji || "✨"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs">
                      <span className="font-medium">{m?.label || r.mood}</span>
                      {r.place_name && <span className="text-muted-foreground"> · {r.place_name}</span>}
                    </div>
                    {r.comment && <p className="text-xs text-foreground/80 line-clamp-1">{r.comment}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PopularMoods;
