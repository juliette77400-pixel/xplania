import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { setLocalOnboarding } from "@/lib/onboarding-state";

const OnboardingSignup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    setLocalOnboarding({ step: "signup" });
  }, []);

  // If already logged in, skip straight to the Tinder step. The Tinder page
  // will sync any pending local needs/qualif into traveler_profiles.
  if (!loading && user) return <Navigate to="/profil-voyageur" replace />;

  const goAuth = () => {
    // Preserve the intended destination so the auth page returns here.
    navigate("/auth?next=/profil-voyageur");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 flex items-center">
      <div className="mx-auto max-w-xl w-full">
        <button
          onClick={() => navigate("/onboarding/qualif")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back", "Retour")}
        </button>
        <div className="gradient-button mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary text-center">
          {t("onboarding.stepOf", "Étape {{n}} / 4", { n: 3 })}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-center">
          {t("onboarding.signup.title", "Créez votre compte")}
        </h1>
        <p className="mt-3 text-center text-muted-foreground">
          {t(
            "onboarding.signup.help",
            "On sauvegarde vos réponses pour reprendre exactement où vous êtes, et pour que vos résultats vous suivent partout.",
          )}
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={goAuth} className="gradient-button" size="lg">
            {t("onboarding.signup.cta", "Continuer avec un compte")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSignup;
