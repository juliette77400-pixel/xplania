import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMoodEntries, type MoodEntry } from "@/hooks/useMoodEntries";
import { moodByKey } from "@/lib/moods";
import MoodRatingDialog from "./MoodRatingDialog";

type Period = "week" | "month" | "all";

const PERIOD_DAYS: Record<Period, number | null> = { week: 7, month: 30, all: null };

function fmtDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale.startsWith("en") ? "en-US" : "fr-FR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

const EMOJI = ["", "😞", "😕", "😐", "🙂", "😍"];

const MoodTrackerPanel = () => {
  const { t, i18n } = useTranslation();
  const { entries, loading, log, remove } = useMoodEntries();
  const [period, setPeriod] = useState<Period>("week");
  const [logOpen, setLogOpen] = useState(false);

  const filtered = useMemo<MoodEntry[]>(() => {
    const days = PERIOD_DAYS[period];
    if (!days) return entries;
    const cutoff = Date.now() - days * 86400000;
    return entries.filter((e) => new Date(e.entry_date).getTime() >= cutoff);
  }, [entries, period]);

  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; total: number; count: number }>();
    [...filtered].reverse().forEach((e) => {
      const k = e.entry_date;
      const prev = map.get(k);
      const r = e.satisfaction_rating ?? 3;
      if (prev) {
        prev.total += r;
        prev.count += 1;
      } else {
        map.set(k, { date: k, total: r, count: 1 });
      }
    });
    return Array.from(map.values()).map((v) => ({
      date: fmtDate(v.date, i18n.language),
      avg: Number((v.total / v.count).toFixed(2)),
    }));
  }, [filtered, i18n.language]);

  const handleManualLog = async (rating: number, note: string) => {
    await log({
      mood_tags: ["manual"],
      satisfaction_rating: rating,
      note: note || null,
      source: "manual_log",
    });
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">{t("moodComp.tracker.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("moodComp.tracker.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setLogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t("moodComp.tracker.logMood")}
        </Button>
      </header>

      <div className="flex gap-1.5">
        {(["week", "month", "all"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              period === p
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card/40 hover:border-primary/40"
            }`}
          >
            {t(`moodComp.tracker.period.${p}`)}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {loading ? t("moodComp.tracker.loading") : t("moodComp.tracker.empty")}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/40 p-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" fill="url(#moodGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">{t("moodComp.tracker.col.date")}</th>
                  <th className="text-left px-3 py-2 font-medium">{t("moodComp.tracker.col.mood")}</th>
                  <th className="text-center px-3 py-2 font-medium">{t("moodComp.tracker.col.rating")}</th>
                  <th className="text-left px-3 py-2 font-medium hidden md:table-cell">{t("moodComp.tracker.col.note")}</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const firstTag = e.mood_tags[0];
                  const m = firstTag ? moodByKey(firstTag) : null;
                  return (
                    <tr key={e.id} className="border-t border-border/40 hover:bg-muted/20">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {fmtDate(e.entry_date, i18n.language)}
                      </td>
                      <td className="px-3 py-2">
                        {m ? `${m.emoji} ${m.label}` : firstTag || "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {e.satisfaction_rating ? EMOJI[e.satisfaction_rating] : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden md:table-cell truncate max-w-xs">
                        {e.note || "—"}
                      </td>
                      <td className="px-1">
                        <button
                          onClick={() => remove(e.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={t("moodComp.tracker.delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MoodRatingDialog open={logOpen} onOpenChange={setLogOpen} onSubmit={handleManualLog} />
    </section>
  );
};

export default MoodTrackerPanel;
