import { useState } from "react";
import { Sparkles, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props { tripId: string; }

interface SummaryData {
  story: string;
  stats: {
    destination?: string;
    duration?: number;
    visited: number;
    total: number;
    points: number;
    badges: number;
    cities: number;
    media: number;
    topTypes: [string, number][];
  };
}

const TripSummary = ({ tripId }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data: r, error } = await supabase.functions.invoke("explore-summary", { body: { tripId } });
      if (error) throw error;
      if (r?.error) throw new Error(r.error);
      setData(r);
    } catch (e: any) {
      toast.error(e?.message || t("x2.sumFail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> {t("x2.summaryTitle")}</h3>
        <Button size="sm" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
          {data ? t("x2.regenerate") : t("x2.generate")}
        </Button>
      </div>

      {!data && !loading && (
        <p className="text-sm text-muted-foreground">{t("x2.summaryHint")}</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: t("x2.sumPlacesVisited"), value: `${data.stats.visited}/${data.stats.total}` },
              { label: t("x2.sumScore"), value: data.stats.points },
              { label: t("x2.sumBadges"), value: data.stats.badges },
              { label: t("x2.sumMemories"), value: data.stats.media },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-background/40 border border-border/60 p-3 text-center">
                <p className="text-xl font-bold text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          {data.stats.topTypes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {data.stats.topTypes.map(([typ, c]) => (
                <span key={typ} className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs">{typ} × {c}</span>
              ))}
            </div>
          )}

          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-line text-foreground/90 text-sm leading-relaxed">
            {data.story}
          </div>
        </>
      )}
    </div>
  );
};

export default TripSummary;
