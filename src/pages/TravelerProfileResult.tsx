import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Gift, Loader2, RefreshCw, Sparkles, Trophy } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile, travelerProfileKey } from "@/hooks/useTravelerProfile";
import { TRAVELER_DIMENSIONS, type FeatureKey } from "@/lib/traveler-badge";
import { Button } from "@/components/ui/button";

const FEATURE_META: Record<FeatureKey, { to: string; iconKey: string }> = {
  discover: { to: "/discover", iconKey: "discover" },
  carnet: { to: "/carnets", iconKey: "carnet" },
  suivi: { to: "/suivi", iconKey: "suivi" },
  mood: { to: "/mood", iconKey: "mood" },
  "guide-valise": { to: "/guide-valise", iconKey: "valise" },
  "guide-budget": { to: "/guide-budget", iconKey: "budget" },
  "guide-visa": { to: "/guide-visa", iconKey: "visa" },
};

const TravelerProfileResult = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useTravelerProfile();
  const queryClient = useQueryClient();

  const radarData = useMemo(() => {
    if (!profile) return [];
    return TRAVELER_DIMENSIONS.map((d) => ({
      dim: t(`travelerProfile.dimensions.${d}`),
      value: Math.max(0, ((profile[`${d}_score` as keyof typeof profile] as number) ?? 0)),
    }));
  }, [profile, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.completed_at) return <Navigate to="/profil-voyageur" replace />;

  const badgeKey = profile.badge ?? "curious";
  const features = (profile.recommended_features ?? []) as FeatureKey[];

  const resetProfile = async () => {
    if (!user) return;
    if (!confirm(t("travelerProfile.resetConfirm"))) return;
    await supabase.from("user_swipes").delete().eq("user_id", user.id);
    await supabase.from("traveler_profiles").delete().eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: travelerProfileKey(user.id) });
    toast.success(t("travelerProfile.resetDone"));
    window.location.href = "/profil-voyageur";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <div className="text-center">
          <div className="gradient-button mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {t("travelerProfile.yourProfile")}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t(`travelerProfile.badges.${badgeKey}.name`)}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {t(`travelerProfile.badges.${badgeKey}.description`)}
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
          <h2 className="mb-4 text-lg font-bold">{t("travelerProfile.yourScores")}</h2>
          <div className="h-[380px] w-full">
            <ResponsiveContainer>
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dim"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Radar
                  name="scores"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-secondary/10 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {t("travelerProfile.rewardsTitle")}
                </p>
                <h2 className="text-xl font-bold">{t("travelerProfile.rewardsSubtitle")}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-background/60 px-4 py-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-extrabold">+{profile.reward_points ?? 0}</span>
              <span className="text-sm font-semibold text-muted-foreground">
                {t("travelerProfile.points")}
              </span>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {(profile.reward_unlocks ?? []).map((u) => (
              <li
                key={u}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/60 p-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">
                    {u === "title"
                      ? t(`travelerProfile.badges.${badgeKey}.name`)
                      : t(`travelerProfile.unlocks.${u}.name`)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {u === "title"
                      ? t("travelerProfile.unlocks.title.description")
                      : t(`travelerProfile.unlocks.${u}.description`)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>



        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold">{t("travelerProfile.recommendedForYou")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => {
              const meta = FEATURE_META[f];
              if (!meta) return null;
              return (
                <Link
                  key={f}
                  to={meta.to}
                  className="group rounded-2xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    {t("travelerProfile.recommendation")}
                  </div>
                  <div className="mt-2 text-xl font-bold">
                    {t(`travelerProfile.features.${f}.name`)}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`travelerProfile.features.${f}.description`)}
                  </p>
                  <div className="mt-4 text-sm font-semibold text-primary group-hover:underline">
                    {t("travelerProfile.discoverNow")} →
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/profil-voyageur/features"
            onClick={() => {
              if (user) {
                void supabase
                  .from("traveler_profiles")
                  .update({ onboarding_step: "features" })
                  .eq("user_id", user.id);
              }
            }}
          >
            <Button className="gradient-button">
              {t("travelerProfile.seeFeatures", "Voir mes fonctionnalités")}
            </Button>
          </Link>
          <Button variant="ghost" onClick={resetProfile}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t("travelerProfile.retake")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TravelerProfileResult;
