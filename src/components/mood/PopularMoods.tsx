import { TrendingUp, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePopularMoods } from "@/hooks/useMoodSocial";
import { moodByKey } from "@/lib/moods";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface Props {
  onSelectMood?: (mood: string) => void;
}

const PopularMoods = ({ onSelectMood }: Props) => {
  const { t, i18n } = useTranslation();
  const { popular, recent, loading } = usePopularMoods();
  const dateLocale = i18n.language?.startsWith("fr") ? fr : enUS;

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-6">{t("moodComp.popular.loading")}</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">{t("moodComp.popular.title7d")}</h3>
        </div>
        {popular.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t("moodComp.popular.noShared")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {popular.map(({ mood, count }) => {
              const m = moodByKey(mood);
              const label = m ? t(`moodComp.moods.${m.key}.label`, { defaultValue: m.label }) : mood;
              return (
                <button
                  key={mood}
                  onClick={() => onSelectMood?.(mood)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all"
                >
                  <span className="text-lg">{m?.emoji || "✨"}</span>
                  <span className="text-sm font-medium">{label}</span>
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
          <h3 className="font-medium text-sm">{t("moodComp.popular.recentTitle")}</h3>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t("moodComp.popular.noRecent")}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => {
              const m = moodByKey(r.mood);
              const label = m ? t(`moodComp.moods.${m.key}.label`, { defaultValue: m.label }) : r.mood;
              return (
                <div key={r.id} className="rounded-lg border border-border bg-card/40 p-2.5 text-sm flex gap-2">
                  <span className="text-2xl shrink-0">{r.emoji || m?.emoji || "✨"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs">
                      <span className="font-medium">{label}</span>
                      {r.place_name && <span className="text-muted-foreground"> · {r.place_name}</span>}
                    </div>
                    {r.comment && <p className="text-xs text-foreground/80 line-clamp-1">{r.comment}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: dateLocale })}
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
