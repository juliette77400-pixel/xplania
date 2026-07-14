import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { setLocalOnboarding, trackOnboardingEvent } from "@/lib/onboarding-state";

const OnboardingSignup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    setLocalOnboarding({ step: "signup" });
    trackOnboardingEvent("step_view", { step: "signup" });
  }, []);

  // Already signed in — OnboardingSyncGate will push localStorage into the DB
  // and route to /onboarding/besoin (or /app if profile is already done).
  if (!loading && user) return <Navigate to="/onboarding/besoin" replace />;

  const goAuth = () => {
    trackOnboardingEvent("signup_cta_click", {});
    // After auth, come back to besoin (OnboardingSyncGate will handle sync).
    navigate("/auth?next=/onboarding/besoin");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 flex items-center">
      <div className="mx-auto max-w-xl w-full">
        <button
          onClick={() => navigate("/profil-voyageur/resultat")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back", "Retour")}
        </button>
        <div className="gradient-button mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary text-center">
          {t("onboarding.signup.step", "Sauvegardez votre profil")}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-center">
          {t("onboarding.signup.title", "Créez votre compte")}
        </h1>
        <p className="mt-3 text-center text-muted-foreground">
          {t(
            "onboarding.signup.help",
            "Créez un compte pour ne pas perdre votre profil de voyageur, vos scores et vos recommandations.",
          )}
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={goAuth} className="gradient-button" size="lg">
            {t("onboarding.signup.cta", "Créer mon compte")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSignup;
