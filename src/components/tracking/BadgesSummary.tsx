import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trophy, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  tripId?: string;
}

interface Summary {
  unlocked: number;
  recent: Array<{ id: string; name: string | null; icon: string | null }>;
}

const BadgesSummary = ({ tripId }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary>({ unlocked: 0, recent: [] });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      let q = supabase
        .from("explore_badges")
        .select("id, name, icon, trip_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (tripId) q = q.eq("trip_id", tripId);
      const { data } = await q;
      const { count } = await supabase
        .from("explore_badges")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (cancelled) return;
      setSummary({
        unlocked: count || 0,
        recent: (data || []).map((b: any) => ({ id: b.id, name: b.name, icon: b.icon })),
      });
    };

    load();

    const channel = supabase
      .channel(`badges-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "explore_badges", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, tripId]);

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-amber-500/5 via-card/60 to-primary/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold">{t("suiviTrip.badges.title")}</h3>
        </div>
        <Link
          to="/gamification"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {t("suiviTrip.badges.viewAll")} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-center px-3">
          <p className="text-2xl font-bold text-amber-500">{summary.unlocked}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("suiviTrip.badges.unlocked")}
          </p>
        </div>
        <div className="flex-1 flex gap-2 flex-wrap">
          {summary.recent.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {t("suiviTrip.badges.empty")}
            </p>
          ) : (
            summary.recent.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border text-xs"
                title={b.name || ""}
              >
                <span>{b.icon || "🏅"}</span>
                <span className="truncate max-w-[100px]">{b.name || "—"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgesSummary;
