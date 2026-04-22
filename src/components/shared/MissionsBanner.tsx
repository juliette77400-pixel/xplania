// Global discrete banner showing weekly missions progress.
// Hidden when all done OR dismissed for the current week. Visible only when authenticated.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Target, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ensureWeeklySnapshot, getCurrentWeekKey } from "@/lib/weekly-missions";

const DISMISS_KEY = "xplania_missions_banner_dismiss_v1";

interface Counts { moodHiddenGems: number; exploreVisited: number; journalMoods: number; }

const HIDDEN_ROUTES = ["/auth", "/reset-password", "/carnet/public", "/suivi/public"];

const MissionsBanner = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [counts, setCounts] = useState<Counts>({ moodHiddenGems: 0, exploreVisited: 0, journalMoods: 0 });
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISS_KEY)); } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const [nodes, blocks, favs] = await Promise.all([
        supabase.from("explore_nodes").select("status").eq("user_id", user.id),
        supabase.from("journal_blocks").select("type").eq("user_id", user.id),
        supabase.from("mood_favorites").select("place_id,mood_places!inner(hidden_gem)").eq("user_id", user.id),
      ]);
      if (cancel) return;
      setCounts({
        exploreVisited: (nodes.data || []).filter((n: any) => n.status === "visited").length,
        journalMoods: (blocks.data || []).filter((b: any) => b.type === "mood").length,
        moodHiddenGems: (favs.data || []).filter((f: any) => f.mood_places?.hidden_gem).length,
      });
    })();
    return () => { cancel = true; };
  }, [user]);

  const baseline = useMemo(() => ensureWeeklySnapshot(counts as any).baseline, [user]);
  const wk = getCurrentWeekKey();

  const done = useMemo(() => {
    const targets: Array<keyof Counts> = ["moodHiddenGems", "exploreVisited", "journalMoods"];
    return targets.filter((k) => Math.max(0, counts[k] - ((baseline?.[k] as number) ?? 0)) >= 1).length;
  }, [counts, baseline]);

  const total = 3;
  const hideForRoute = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));
  if (!user || hideForRoute) return null;
  if (done >= total) return null;
  if (dismissed === wk) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, wk); } catch {}
    setDismissed(wk);
  };

  return (
    <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-fuchsia-500/5 to-amber-500/10">
      <div className="container mx-auto px-3 sm:px-6 py-1.5 flex items-center gap-3">
        <Target className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-xs flex-1 min-w-0 truncate">
          <span className="font-semibold">{t("missionsBanner.title")}</span>
          <span className="text-muted-foreground"> · {t("missionsBanner.progress", { done, total })}</span>
        </p>
        <Link to="/gamification" className="hidden sm:inline-flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0">
          {t("missionsBanner.cta")} <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          onClick={dismiss}
          aria-label={t("missionsBanner.dismiss")}
          className="p-1 rounded hover:bg-muted/60 shrink-0"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MissionsBanner;
