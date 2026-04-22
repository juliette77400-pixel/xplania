// ✨ NEW (Tâche 3) — Carte des "voyages terminés" avec trophées.
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Trip } from "@/hooks/useTrips";

interface Props {
  trips: Trip[];
}

const medalFor = (rank: number, t: (k: string) => string) => {
  if (rank === 0) return { emoji: "🥇", label: t("trophies.labelLatest"), grad: "from-amber-400 to-orange-500" };
  if (rank === 1) return { emoji: "🥈", label: t("trophies.labelMemory"), grad: "from-slate-300 to-slate-400" };
  if (rank === 2) return { emoji: "🥉", label: t("trophies.labelMemory"), grad: "from-amber-700 to-orange-800" };
  return { emoji: "🏅", label: t("trophies.labelPast"), grad: "from-violet-400 to-purple-500" };
};

const PastTripsTrophies = ({ trips }: Props) => {
  const { t } = useTranslation();
  const now = new Date();
  const past = trips
    .filter((tr) => tr.return_date && new Date(tr.return_date) < now)
    .sort((a, b) => new Date(b.return_date!).getTime() - new Date(a.return_date!).getTime())
    .slice(0, 6);

  if (past.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> {t("trophies.title")}
        </h2>
        <span className="text-xs text-muted-foreground">{t("trophies.adventures", { count: past.length })}</span>
      </div>

      <Card className="p-4 bg-gradient-to-br from-amber-500/5 via-card to-violet-500/5 border-amber-500/20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {past.map((tr, i) => {
            const m = medalFor(i, t);
            return (
              <Link
                key={tr.id}
                to={`/carnet/${tr.id}`}
                className="group flex flex-col items-center text-center gap-1.5 p-3 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.grad} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {m.emoji}
                </div>
                <p className="text-[11px] font-semibold line-clamp-1 w-full">
                  {tr.title || tr.destination || t("trophies.fallbackTrip")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {tr.return_date && new Date(tr.return_date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </p>
              </Link>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" /> {t("trophies.memoriesNote")}
          </p>
          <Link to="/gamification" className="text-xs text-primary hover:underline flex items-center gap-1">
            {t("trophies.viewAllBadges")} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Card>
    </section>
  );
};

export default PastTripsTrophies;
