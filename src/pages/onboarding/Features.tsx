import { Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import { setLocalOnboarding } from "@/lib/onboarding-state";
import type { FeatureKey } from "@/lib/traveler-badge";
import { Button } from "@/components/ui/button";

const FEATURE_ROUTE: Record<FeatureKey, string> = {
  discover: "/discover",
  carnet: "/carnets",
  suivi: "/suivi",
  mood: "/mood",
  "guide-valise": "/guide-valise",
  "guide-budget": "/guide-budget",
  "guide-visa": "/guide-visa",
};

const OnboardingFeatures = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useTravelerProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.completed_at) return <Navigate to="/" replace />;

  const features = ((profile.recommended_features ?? []) as FeatureKey[]).slice(0, 2);
  const badgeKey = profile.badge ?? "curious";

  const pick = async (f: FeatureKey) => {
    setLocalOnboarding({ step: "essai" });
    if (user) {
      await supabase
        .from("traveler_profiles")
        .update({ onboarding_step: "essai" })
        .eq("user_id", user.id);
    }
    window.location.href = `/profil-voyageur/essai?f=${f}`;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="gradient-button mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t("onboarding.features.tag", "Vos deux atouts")}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {t("onboarding.features.title", "Deux fonctionnalités faites pour vous")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("onboarding.features.subtitle", {
              defaultValue: "Sélectionnées d'après votre profil {{badge}}.",
              badge: t(`travelerProfile.badges.${badgeKey}.name`),
            })}
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f}
              className="rounded-2xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
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
              <Button onClick={() => pick(f)} className="mt-5 w-full gradient-button">
                {t("onboarding.features.tryIt", "Essayer cet aperçu")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/app"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {t("onboarding.features.skip", "Passer et voir le dashboard →")}
          </Link>
        </div>
        {/* Keep the FEATURE_ROUTE map referenced for future direct linking. */}
        <span className="hidden">{Object.keys(FEATURE_ROUTE).length}</span>
      </div>
    </div>
  );
};

export default OnboardingFeatures;
