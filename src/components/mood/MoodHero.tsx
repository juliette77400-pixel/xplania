import { Cloud, Clock, MapPin, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { moodByKey, timeOfDay } from "@/lib/moods";

interface Props {
  activeMood: string | null;
  weather: string | null;
  position: { lat: number; lng: number } | null;
  onReset: () => void;
}

const MoodHero = ({ activeMood, weather, position, onReset }: Props) => {
  const { t } = useTranslation();
  const m = activeMood ? moodByKey(activeMood) : null;
  const tod = timeOfDay();
  const todLabel = t(`moodComp.tod.${tod}`, { defaultValue: tod });
  const moodLabel = m ? t(`moodComp.moods.${m.key}.label`, { defaultValue: m.label }) : null;
  const moodDesc = m ? t(`moodComp.moods.${m.key}.description`, { defaultValue: m.description }) : null;

  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background backdrop-blur-sm p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-primary/80 font-semibold">{t("moodComp.hero.kicker")}</p>
          {m ? (
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl">{m.emoji}</span> {moodLabel}
            </h1>
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold">{t("moodComp.hero.title")}</h1>
          )}
          <p className="text-sm text-muted-foreground">
            {m ? moodDesc : t("moodComp.hero.subtitle")}
          </p>
        </div>

        {activeMood && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> {t("moodComp.hero.change")}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-4">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {todLabel}</span>
        {weather && <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> {weather}</span>}
        {position && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {position.lat.toFixed(2)}, {position.lng.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

export default MoodHero;
