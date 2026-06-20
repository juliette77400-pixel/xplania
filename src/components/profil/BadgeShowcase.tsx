// Profile "trophy shelf": shows the user's most recent unlocked badges
// (joined from gam_badge_claims) and a few suggested next badges they can claim.
// Lot 2 — vitrine Profil.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Award, ArrowRight, Sparkles, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UnlockedBadge {
  id: string;
  name: string;
  icon: string | null;
  points: number;
  validated_at: string | null;
}
interface SuggestedBadge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  points: number;
}

const MAX_UNLOCKED = 6;
const MAX_SUGGESTED = 4;

const BadgeShowcase = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const [unlocked, setUnlocked] = useState<UnlockedBadge[] | null>(null);
  const [suggested, setSuggested] = useState<SuggestedBadge[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      try {
        const { data: claims, error: e1 } = await supabase
          .from("gam_badge_claims")
          .select("badge_id, reviewed_at, created_at, gam_badges(id, name_fr, name_en, icon, points)")
          .eq("user_id", user.id)
          .eq("status", "validated")
          .order("reviewed_at", { ascending: false, nullsFirst: false })
          .limit(MAX_UNLOCKED);
        if (e1) throw e1;

        const owned = (claims || []).map((c: any) => ({
          id: c.gam_badges?.id || c.badge_id,
          name: (isFr ? c.gam_badges?.name_fr : c.gam_badges?.name_en) || "—",
          icon: c.gam_badges?.icon || null,
          points: c.gam_badges?.points || 0,
          validated_at: c.reviewed_at || c.created_at || null,
        }));
        const ownedIds = owned.map((b) => b.id);

        let suggQuery = supabase
          .from("gam_badges")
          .select("id, name_fr, name_en, description_fr, description_en, icon, points")
          .eq("active", true)
          .order("points", { ascending: true })
          .limit(MAX_SUGGESTED + ownedIds.length);
        if (ownedIds.length) suggQuery = suggQuery.not("id", "in", `(${ownedIds.join(",")})`);
        const { data: sugg, error: e2 } = await suggQuery;
        if (e2) throw e2;

        const sg = (sugg || []).slice(0, MAX_SUGGESTED).map((b: any) => ({
          id: b.id,
          name: (isFr ? b.name_fr : b.name_en) || "—",
          description: (isFr ? b.description_fr : b.description_en) || "",
          icon: b.icon || null,
          points: b.points || 0,
        }));

        if (cancel) return;
        setUnlocked(owned);
        setSuggested(sg);
      } catch {
        if (!cancel) setError(true);
      }
    })();
    return () => { cancel = true; };
  }, [user, isFr]);

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">{t("profil.badges.error")}</p>
      </Card>
    );
  }

  if (unlocked === null || suggested === null) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> {t("profil.badges.title")}
        </h2>
        <Button asChild variant="ghost" size="sm" className="text-xs h-7">
          <Link to="/gamification">
            {t("profil.badges.viewAll")} <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>

      {unlocked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Lock className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">{t("profil.badges.emptyTitle")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("profil.badges.emptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {unlocked.map((b) => (
            <div
              key={b.id}
              className="group relative rounded-xl border border-border/60 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-3 text-center transition-transform hover:scale-105"
              title={b.name}
            >
              <div className="text-2xl mb-1">{b.icon || "🏅"}</div>
              <p className="text-[10px] font-semibold leading-tight line-clamp-2">{b.name}</p>
              <Badge variant="secondary" className="absolute -top-1.5 -right-1.5 text-[9px] h-4 px-1.5">
                +{b.points}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {suggested.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border">
          <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5" /> {t("profil.badges.suggestedTitle")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {suggested.map((b) => (
              <div key={b.id} className="rounded-lg border border-border/60 p-2.5 flex items-start gap-2">
                <div className="text-lg shrink-0 opacity-70">{b.icon || "🎯"}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default BadgeShowcase;
