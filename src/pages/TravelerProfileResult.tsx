import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Gift, Loader2, Lock, LogIn, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile, travelerProfileKey } from "@/hooks/useTravelerProfile";
import {
  TRAVELER_DIMENSIONS,
  type FeatureKey,
  type TravelerBadgeKey,
  type TravelerScores,
} from "@/lib/traveler-badge";
import {
  ALL_APP_FEATURES,
  deriveFreeFeatures,
  derivePremiumPack,
  dominantDimension,
  SCORE_LABEL_FR,
  topDimensions,
} from "@/lib/feature-unlocks";
import { hasUnlimitedAccess } from "@/lib/admin-access";
import { Button } from "@/components/ui/button";
import PremiumUnlockDialog from "@/components/premium/PremiumUnlockDialog";
import {
  clearLocalOnboarding,
  getLocalOnboarding,
  setLocalOnboarding,
  trackOnboardingEvent,
} from "@/lib/onboarding-state";

const FEATURE_META: Record<FeatureKey, { to: string; iconKey: string }> = {
  discover: { to: "/discover", iconKey: "discover" },
  carnet: { to: "/carnets", iconKey: "carnet" },
  suivi: { to: "/suivi", iconKey: "suivi" },
  mood: { to: "/mood", iconKey: "mood" },
  "guide-valise": { to: "/guide-valise", iconKey: "valise" },
  "guide-budget": { to: "/guide-budget", iconKey: "budget" },
  "guide-visa": { to: "/guide-visa", iconKey: "visa" },
};

interface DisplayProfile {
  badge: TravelerBadgeKey;
  scores: Partial<TravelerScores>;
  features: FeatureKey[];
  reward_points: number;
  reward_unlocks: string[];
}

const TravelerProfileResult = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useTravelerProfile();
  const queryClient = useQueryClient();

  useEffect(() => {
    trackOnboardingEvent("step_view", { step: "resultat" });
  }, []);

  const local = useMemo(() => (user ? null : getLocalOnboarding()), [user]);

  const display: DisplayProfile | null = useMemo(() => {
    if (user) {
      if (!profile?.completed_at) return null;
      const scores: Partial<TravelerScores> = {};
      for (const d of TRAVELER_DIMENSIONS) {
        scores[d] = (profile[`${d}_score` as keyof typeof profile] as number) ?? 0;
      }
      return {
        badge: (profile.badge ?? "curious") as TravelerBadgeKey,
        scores,
        features: (profile.recommended_features ?? []) as FeatureKey[],
        reward_points: profile.reward_points ?? 0,
        reward_unlocks: (profile.reward_unlocks ?? []) as string[],
      };
    }
    // Anonymous mode — read from localStorage.
    if (!local?.result) return null;
    return {
      badge: local.result.badge,
      scores: local.result.scores,
      features: local.result.features,
      reward_points: local.result.reward_points,
      reward_unlocks: local.result.reward_unlocks,
    };
  }, [user, profile, local]);

  const scoreData = useMemo(() => {
    if (!display) return [];
    return TRAVELER_DIMENSIONS.map((d) => ({
      key: d,
      dim: t(`travelerProfile.dimensions.${d}`),
      value: Math.min(100, Math.max(0, display.scores[d] ?? 0)),
    }));
  }, [display, t]);

  const dominantKeys = useMemo(
    () => (display ? new Set(topDimensions(display.scores, 4)) : new Set()),
    [display],
  );

  // Freemium: 2 free features derived dynamically from the traveler's profile.
  // Admins / dev bypass unlock every card.
  const unlimited = hasUnlimitedAccess();
  const freeFeatures = useMemo(
    () => (display ? deriveFreeFeatures(display.scores) : (["mood", "discover"] as [FeatureKey, FeatureKey])),
    [display],
  );
  const freeSet = useMemo(
    () => (unlimited ? new Set<FeatureKey>(ALL_APP_FEATURES) : new Set<FeatureKey>(freeFeatures)),
    [freeFeatures, unlimited],
  );
  const dominantKey = useMemo(() => (display ? dominantDimension(display.scores) : null), [display]);
  const highlightPack = useMemo(() => (display ? derivePremiumPack(display.scores) : "all"), [display]);

  const [premiumOpen, setPremiumOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null);
  const openPremium = (f: FeatureKey) => {
    trackOnboardingEvent("premium_lock_click", { feature: f });
    setLockedFeature(f);
    setPremiumOpen(true);
  };

  if (user && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!display) return <Navigate to="/" replace />;

  const badgeKey = display.badge;
  // `display.features` (the badge's default picks) is kept in the DB for
  // historical / RAG use but is no longer rendered — the free features are
  // derived dynamically from the traveler's scores via `deriveFreeFeatures`.

  const restart = async () => {
    if (!confirm(t("travelerProfile.resetConfirm", "Recommencer le questionnaire ?"))) return;
    trackOnboardingEvent("restart_click", { authed: !!user });
    if (user) {
      await supabase.from("user_swipes").delete().eq("user_id", user.id);
      await supabase.from("traveler_profiles").delete().eq("user_id", user.id);
      queryClient.invalidateQueries({ queryKey: travelerProfileKey(user.id) });
    }
    // Preserve the session_id for continuous tracking.
    const sessionId = getLocalOnboarding().session_id;
    clearLocalOnboarding();
    setLocalOnboarding({ session_id: sessionId, step: "tinder" });
    toast.success(t("travelerProfile.resetDone"));
    window.location.href = "/";
  };

  const goSignup = () => {
    trackOnboardingEvent("save_profile_click", {});
    setLocalOnboarding({ step: "signup" });
    navigate("/onboarding/signup");
  };

  const goNext = async () => {
    trackOnboardingEvent("resultat_continue", {});
    if (user) {
      setLocalOnboarding({ step: "besoin" });
      await supabase
        .from("traveler_profiles")
        .update({ onboarding_step: "besoin" })
        .eq("user_id", user.id);
      navigate("/onboarding/besoin");
    } else {
      goSignup();
    }
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

        {!user && (
          <div className="mt-8 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
            <p className="text-sm font-semibold">
              {t(
                "travelerProfile.saveWarn",
                "⚠️ Ce profil n'est pas encore enregistré. Créez votre compte pour ne pas le perdre.",
              )}
            </p>
          </div>
        )}

        <div className="mt-10 rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">{t("travelerProfile.yourScores")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("travelerProfile.topScoresHint", { defaultValue: "Tes affinités dominantes en surbrillance" })}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2" aria-label={t("travelerProfile.yourScores")}>
            {scoreData.map((item) => {
              const dominant = dominantKeys.has(item.key);
              return (
                <div
                  key={item.key}
                  className={`rounded-2xl border p-4 transition ${
                    dominant
                      ? "border-primary/60 bg-primary/10 shadow-sm"
                      : "border-border/60 bg-background/60"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">
                    <span className={`min-w-0 truncate ${dominant ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.dim}
                    </span>
                    <span className="shrink-0 text-foreground">{Math.round(item.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        dominant ? "bg-gradient-to-r from-primary to-secondary" : "bg-primary/70"
                      }`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
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
              <span className="text-2xl font-extrabold">+{display.reward_points}</span>
              <span className="text-sm font-semibold text-muted-foreground">
                {t("travelerProfile.points")}
              </span>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {display.reward_unlocks.map((u) => (
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
          <div className="mb-4 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 via-card to-secondary/10 p-4 sm:p-5">
            <p className="text-sm font-semibold">
              🎉{" "}
              {dominantKey
                ? t("travelerProfile.freeIntroDynamic", {
                    trait: SCORE_LABEL_FR[dominantKey],
                    defaultValue: `Basé sur ${SCORE_LABEL_FR[dominantKey]}, voici tes 2 accès gratuits à vie.`,
                  })
                : t("travelerProfile.freeIntroStatic", {
                    defaultValue: "Voici tes 2 accès gratuits à vie, choisis pour toi.",
                  })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("travelerProfile.freeIntroHint", {
                defaultValue: "Les autres fonctionnalités sont disponibles avec Premium.",
              })}
            </p>
          </div>

          <h2 className="mb-4 text-lg font-bold">{t("travelerProfile.recommendedForYou")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ALL_APP_FEATURES.map((f) => {
              const meta = FEATURE_META[f];
              if (!meta) return null;
              const isFree = freeSet.has(f);
              const to = user ? meta.to : "/onboarding/signup";
              const name = t(`travelerProfile.features.${f}.name`);
              const desc = t(`travelerProfile.features.${f}.description`);

              if (isFree) {
                return (
                  <Link
                    key={f}
                    to={to}
                    className="group relative overflow-hidden rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/10 via-card to-secondary/5 p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
                  >
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3 w-3" />
                      {t("travelerProfile.freeAccess", { defaultValue: "Accès gratuit" })}
                    </div>
                    <div className="mt-3 text-xl font-bold">{name}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                    <div className="mt-4 text-sm font-semibold text-primary group-hover:underline">
                      {t("travelerProfile.discoverNow")} →
                    </div>
                  </Link>
                );
              }

              // Locked card: click opens the premium modal.
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => openPremium(f)}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 text-left transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
                  aria-label={t("travelerProfile.unlockWithPremium", {
                    feature: name,
                    defaultValue: `Débloquer ${name} avec Premium`,
                  })}
                >
                  {/* frosted overlay for the locked look */}
                  <div className="pointer-events-none absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      {t("travelerProfile.premium", { defaultValue: "Premium" })}
                    </div>
                    <div className="mt-3 text-xl font-bold text-foreground/80">{name}</div>
                    <p className="mt-2 text-sm text-muted-foreground/90 line-clamp-2">{desc}</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:underline">
                      <Lock className="h-3.5 w-3.5" />
                      {t("travelerProfile.unlockCta", { defaultValue: "Débloquer avec Premium" })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Button className="gradient-button" onClick={goNext}>
              {t("travelerProfile.seeFeatures", "Continuer")}
            </Button>
          ) : (
            <Button className="gradient-button" size="lg" onClick={goSignup}>
              <LogIn className="mr-2 h-4 w-4" />
              {t("travelerProfile.saveProfileCta", "Créer mon compte pour sauvegarder mon profil")}
            </Button>
          )}
          <Button variant="ghost" onClick={restart}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t("travelerProfile.retake", "Recommencer")}
          </Button>
        </div>
      </div>

      <PremiumUnlockDialog
        open={premiumOpen}
        onOpenChange={setPremiumOpen}
        lockedFeature={lockedFeature}
        highlightPack={highlightPack}
      />
    </div>
  );
};

export default TravelerProfileResult;
