import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import {
  getLocalOnboarding,
  setLocalOnboarding,
  stepToRoute,
} from "@/lib/onboarding-state";

const Welcome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useTravelerProfile();

  // If a logged-in user lands here mid-parcours, resume where they left off.
  useEffect(() => {
    if (user && profile?.onboarding_step && profile.onboarding_step !== "welcome") {
      navigate(stepToRoute(profile.onboarding_step as never), { replace: true });
    }
  }, [user, profile, navigate]);

  const local = useMemo(() => getLocalOnboarding(), []);
  const hasProgress = local.step !== "welcome";

  const start = () => {
    setLocalOnboarding({ step: hasProgress ? local.step : "besoin" });
    navigate(hasProgress ? stepToRoute(local.step) : "/onboarding/besoin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-xl text-center">
        <div className="gradient-button mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Xplania</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("onboarding.welcome.title", "Voyagez comme vous êtes.")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          {t(
            "onboarding.welcome.promise",
            "Xplania construit chaque étape de votre voyage autour de votre personnalité, pas de listes standard.",
          )}
        </p>
        <Button onClick={start} className="gradient-button mt-8" size="lg">
          {hasProgress
            ? t("onboarding.welcome.continue", "Continuer")
            : t("onboarding.welcome.cta", "Commencer")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <div className="mt-6 text-xs text-muted-foreground">
          {t("onboarding.welcome.haveAccount", "Vous avez déjà un compte ?")}{" "}
          <Link to="/auth" className="text-primary hover:underline">
            {t("auth.signin", "Se connecter")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
