import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getLocalOnboarding,
  setLocalOnboarding,
  trackOnboardingEvent,
} from "@/lib/onboarding-state";

const NEEDS = [
  { key: "no_idea", fr: "Je ne sais pas où partir", en: "I don't know where to go" },
  { key: "prepare_trip", fr: "Je prépare un voyage", en: "I'm preparing a trip" },
  { key: "budget_fear", fr: "J'ai peur de dépasser mon budget", en: "I'm scared of overspending" },
  { key: "want_unusual", fr: "J'ai envie d'insolite", en: "I want off-the-beaten-path" },
  { key: "travel_differently", fr: "Voyager autrement", en: "Travel differently" },
  { key: "just_curious", fr: "Juste curieux", en: "Just curious" },
];

const Besoin = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEn = i18n.language?.startsWith("en");

  const initial = useMemo(() => getLocalOnboarding().needs ?? [], []);
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));

  useEffect(() => {
    setLocalOnboarding({ step: "besoin" });
    trackOnboardingEvent("step_view", { step: "besoin" });
  }, []);

  const toggle = (k: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  };

  const next = async () => {
    const arr = Array.from(selected);
    setLocalOnboarding({ needs: arr, step: "features" });
    trackOnboardingEvent("step_complete", { step: "besoin", needs: arr });
    if (user) {
      await supabase
        .from("traveler_profiles")
        .update({ need_tags: arr as never, onboarding_step: "features" })
        .eq("user_id", user.id);
    }
    navigate("/profil-voyageur/features");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/profil-voyageur/resultat")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back", "Retour")}
        </button>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("onboarding.stepOf", "Étape {{n}} / 3", { n: 1 })}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
          {t("onboarding.besoin.title", "Qu'est-ce qui vous amène ?")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("onboarding.besoin.help", "Choisissez tout ce qui vous ressemble.")}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {NEEDS.map((n) => {
            const active = selected.has(n.key);
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => toggle(n.key)}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span className="font-medium">{isEn ? n.en : n.fr}</span>
                {active && <Check className="h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-end">
          <Button
            onClick={next}
            disabled={selected.size === 0}
            className="gradient-button"
            size="lg"
          >
            {t("common.next", "Suivant")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Besoin;
