import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, MapPin, Smile, Star, Camera, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { JournalDay } from "@/hooks/useJournal";
import { formatDayLabel } from "@/lib/journal-utils";

interface Props {
  days: JournalDay[];
}

interface Insights {
  topLocations: { name: string; count: number }[];
  highlights: { date: string; text: string }[];
  happiestDay: { date: string; score: number; emoji: string } | null;
  stats: { photoCount: number; noteCount: number; totalBlocks: number; daysCount: number };
}

const InsightsPanel = ({ days }: Props) => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    if (!days.length) return;
    supabase.functions.invoke("journal-insights", { body: { days } }).then(({ data }) => {
      if (data && !data.error) setInsights(data);
    });
  }, [days]);

  if (!insights) return null;
  const { topLocations, happiestDay, highlights, stats } = insights;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">{t("j2.insightsTitle")}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-muted/30 text-center">
          <FileText className="w-4 h-4 mx-auto text-primary" />
          <p className="text-xl font-bold text-foreground mt-1">{stats.noteCount}</p>
          <p className="text-xs text-muted-foreground">{t("j2.iNotes")}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 text-center">
          <Camera className="w-4 h-4 mx-auto text-primary" />
          <p className="text-xl font-bold text-foreground mt-1">{stats.photoCount}</p>
          <p className="text-xs text-muted-foreground">{t("j2.iPhotos")}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 text-center">
          <MapPin className="w-4 h-4 mx-auto text-primary" />
          <p className="text-xl font-bold text-foreground mt-1">{topLocations.length}</p>
          <p className="text-xs text-muted-foreground">{t("j2.iPlaces")}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 text-center">
          <Smile className="w-4 h-4 mx-auto text-primary" />
          <p className="text-xl font-bold text-foreground mt-1">{stats.daysCount}</p>
          <p className="text-xs text-muted-foreground">{t("j2.iDays")}</p>
        </div>
      </div>

      {happiestDay && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("j2.happiestDay")}</p>
          <p className="text-lg font-semibold text-foreground mt-1">
            {happiestDay.emoji} {formatDayLabel(happiestDay.date)}
          </p>
        </div>
      )}

      {topLocations.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("j2.topPlaces")}</p>
          <div className="space-y-1.5">
            {topLocations.map((l) => (
              <div key={l.name} className="flex justify-between items-center text-sm">
                <span className="text-foreground">📍 {l.name}</span>
                <span className="text-xs text-muted-foreground">×{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {highlights.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("j2.highlights")}</p>
          <div className="space-y-2">
            {highlights.slice(0, 3).map((h, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
