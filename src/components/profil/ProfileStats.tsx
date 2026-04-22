// Aggregates user-wide stats from Supabase for the Profile page.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plane, Award, Zap, Flame, Map as MapIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStreakDisplay } from "@/lib/streak";
import { computeXp, getLevelProgress } from "@/lib/xp-levels";

interface Stats {
  trips: number;
  badges: number;
  xp: number;
  level: number;
  streak: number;
  km: number;
}

const ProfileStats = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const [trips, exploreBadges, journalBadges, moodBadges, exploreNodes, journalBlocks, reviews, moodReactions, tracking] = await Promise.all([
        supabase.from("trips").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("explore_badges").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("journal_badges").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("mood_badges").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("explore_nodes").select("status").eq("user_id", user.id),
        supabase.from("journal_blocks").select("type").eq("user_id", user.id),
        supabase.from("place_reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("mood_reactions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("trip_tracking").select("total_distance_km").eq("user_id", user.id),
      ]);
      if (cancel) return;

      const visited = (exploreNodes.data || []).filter((n: any) => n.status === "visited").length;
      const photos = (journalBlocks.data || []).filter((b: any) => b.type === "photo").length;
      const moods = (journalBlocks.data || []).filter((b: any) => b.type === "mood").length;
      const notes = (journalBlocks.data || []).filter((b: any) => b.type === "note").length;
      const km = (tracking.data || []).reduce((acc: number, t: any) => acc + Number(t.total_distance_km || 0), 0);
      const totalBadges = (exploreBadges.count || 0) + (journalBadges.count || 0) + (moodBadges.count || 0);

      const xp = computeXp({
        exploreVisited: visited,
        journalNotes: notes,
        journalPhotos: photos,
        journalLocations: 0,
        journalMoods: moods,
        moodFavorites: 0,
        moodHiddenGems: 0,
        badgesTotal: totalBadges,
        placeReviews: reviews.count || 0,
        moodReactions: moodReactions.count || 0,
      });
      const lvl = getLevelProgress(xp).level.index;
      const streak = getStreakDisplay().streak;

      setStats({
        trips: trips.count || 0,
        badges: totalBadges,
        xp,
        level: lvl,
        streak,
        km: Math.round(km),
      });
    })();
    return () => { cancel = true; };
  }, [user]);

  if (!stats) {
    return (
      <Card className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </Card>
    );
  }

  const items = [
    { icon: Plane, label: t("profil.stats.trips"), value: stats.trips, color: "from-cyan-400 to-blue-500" },
    { icon: Award, label: t("profil.stats.badges"), value: stats.badges, color: "from-amber-400 to-orange-500" },
    { icon: Zap, label: `${t("profil.stats.level")} ${stats.level}`, value: `${stats.xp} XP`, color: "from-purple-400 to-fuchsia-500" },
    { icon: Flame, label: t("profil.stats.streak"), value: `${stats.streak}j`, color: "from-rose-400 to-red-500" },
    { icon: MapIcon, label: t("profil.stats.km"), value: stats.km, color: "from-emerald-400 to-teal-500" },
  ];

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-sm font-bold mb-3">{t("profil.stats.title")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="rounded-xl border border-border/60 p-3 text-center">
              <div className={`w-9 h-9 mx-auto rounded-xl bg-gradient-to-br ${it.color} flex items-center justify-center mb-1.5`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-base font-bold leading-none">{it.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{it.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ProfileStats;
