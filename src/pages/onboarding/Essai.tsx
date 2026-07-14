import { useEffect, useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import { setLocalOnboarding, clearLocalOnboarding } from "@/lib/onboarding-state";
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

// Very small "teaser" content shown as a limited preview per feature.
const TEASERS: Record<FeatureKey, { fr: string[]; en: string[] }> = {
  discover: {
    fr: ["Un café confidentiel repéré par la communauté", "Une balade au coucher de soleil"],
    en: ["A hidden café loved by locals", "A sunset stroll worth the detour"],
  },
  mood: {
    fr: ["Une ambiance « slow morning » qui vous ressemble"],
    en: ["A slow-morning vibe made for you"],
  },
  carnet: {
    fr: ["Un carnet type prêt à remplir dès votre premier voyage"],
    en: ["A ready-made journal for your next trip"],
  },
  suivi: {
    fr: ["Un aperçu du live tracking de vos itinéraires"],
    en: ["A preview of live trip tracking"],
  },
  "guide-valise": {
    fr: ["3 essentiels adaptés à votre profil"],
    en: ["3 essentials tuned to your profile"],
  },
  "guide-budget": {
    fr: ["Une estimation flash de votre prochain voyage"],
    en: ["A flash estimate of your next trip"],
  },
  "guide-visa": {
    fr: ["Une formalité vérifiée en un clic"],
    en: ["One formality checked in a click"],
  },
};

const OnboardingEssai = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useTravelerProfile();
  const [params] = useSearchParams();
  const f = (params.get("f") as FeatureKey) || "discover";

  useEffect(() => {
    setLocalOnboarding({ step: "essai" });
  }, []);

  const teaser = useMemo(() => {
    const set = TEASERS[f] ?? TEASERS.discover;
    return i18n.language?.startsWith("en") ? set.en : set.fr;
  }, [f, i18n.language]);

  const finish = async () => {
    if (user) {
      await supabase
        .from("traveler_profiles")
        .update({ onboarding_step: "done" })
        .eq("user_id", user.id);
    }
    clearLocalOnboarding();
    window.location.href = "/app";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.completed_at) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="gradient-button mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t("onboarding.essai.tag", "Aperçu")}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {t(`travelerProfile.features.${f}.name`)}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("onboarding.essai.help", "Un avant-goût de ce que Xplania fera pour vous.")}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
          <ul className="space-y-3">
            {teaser.map((line, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-sm">{line}</p>
              </li>
            ))}
            <li className="flex items-start gap-3 opacity-60">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <p className="text-sm">
                {t("onboarding.essai.locked", "Débloquez la version complète dans votre dashboard.")}
              </p>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={finish} className="gradient-button" size="lg">
            {t("onboarding.essai.unlock", "Débloquer tout")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link
            to={FEATURE_ROUTE[f] ?? "/app"}
            onClick={finish}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {t("onboarding.essai.openFeature", "Ouvrir la fonctionnalité complète")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OnboardingEssai;
