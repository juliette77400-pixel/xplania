// ✨ NEW (Tâche 3) — Carte missions hebdo sur le Dashboard.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Target, Search, Landmark, Heart, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ensureWeeklySnapshot, formatTimeLeft } from "@/lib/weekly-missions";

interface Counts {
  moodHiddenGems: number;
  exploreVisited: number;
  journalMoods: number;
}

const buildMissions = (t: (k: string) => string) => [
  { key: "moodHiddenGems" as const, title: t("weeklyMissionsCard.missionGem"), xp: 50, icon: Search, link: "/discover", color: "from-cyan-400 to-cyan-500", target: 1 },
  { key: "exploreVisited" as const, title: t("weeklyMissionsCard.missionExplore"), xp: 75, icon: Landmark, link: "/explore", color: "from-purple-400 to-purple-500", target: 1 },
  { key: "journalMoods" as const, title: t("weeklyMissionsCard.missionMood"), xp: 100, icon: Heart, link: "/carnets", color: "from-pink-400 to-rose-500", target: 1 },
];

const WeeklyMissionsCard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts>({ moodHiddenGems: 0, exploreVisited: 0, journalMoods: 0 });
  const [tick, setTick] = useState(0);
  const MISSIONS = useMemo(() => buildMissions(t), [t]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [nodes, blocks, favs] = await Promise.all([
        supabase.from("explore_nodes").select("status").eq("user_id", user.id),
        supabase.from("journal_blocks").select("type").eq("user_id", user.id),
        supabase.from("mood_favorites").select("place_id,mood_places!inner(hidden_gem)").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setCounts({
        exploreVisited: (nodes.data || []).filter((n: any) => n.status === "visited").length,
        journalMoods: (blocks.data || []).filter((b: any) => b.type === "mood").length,
        moodHiddenGems: (favs.data || []).filter((f: any) => f.mood_places?.hidden_gem).length,
      });
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const baseline = useMemo(() => ensureWeeklySnapshot(counts as any).baseline, [user]);
  const timeLeft = useMemo(() => formatTimeLeft(), [tick]);

  const items = MISSIONS.map((m) => {
    const cur = counts[m.key];
    const base = (baseline?.[m.key] as number | undefined) ?? 0;
    const delta = Math.max(0, cur - base);
    const progress = Math.min(m.target, delta);
    const pct = Math.round((progress / m.target) * 100);
    return { ...m, progress, pct, done: progress >= m.target };
  });

  const doneCount = items.filter((i) => i.done).length;

  if (!user) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> {t("weeklyMissionsCard.title")}
          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 min-w-[26px]">
            {doneCount}/{MISSIONS.length}
          </span>
        </h2>
        <Link to="/gamification" className="text-[10px] text-primary hover:underline flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" /> {timeLeft}
        </Link>
      </div>
      <div className="space-y-2.5">
        {items.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.title}
              to={m.link}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-semibold truncate ${m.done ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                  <span className="text-[10px] font-bold text-primary shrink-0">+{m.xp} XP</span>
                </div>
                <Progress value={m.pct} className="h-1.5 mt-1" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
};

export default WeeklyMissionsCard;
