import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getLocalOnboarding,
  setLocalOnboarding,
  type OnboardingQualif,
} from "@/lib/onboarding-state";

type Group = { key: keyof OnboardingQualif; label: string; options: { v: string; l: string }[] };

const Qualif = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const initial = useMemo(() => getLocalOnboarding().qualif ?? {}, []);
  const [q, setQ] = useState<OnboardingQualif>(initial);

  const groups: Group[] = [
    {
      key: "budget",
      label: t("onboarding.qualif.budget", "Budget approximatif"),
      options: [
        { v: "low", l: t("onboarding.qualif.budgetLow", "Petit") },
        { v: "mid", l: t("onboarding.qualif.budgetMid", "Moyen") },
        { v: "high", l: t("onboarding.qualif.budgetHigh", "Confortable") },
      ],
    },
    {
      key: "duration",
      label: t("onboarding.qualif.duration", "Durée type"),
      options: [
        { v: "weekend", l: t("onboarding.qualif.weekend", "Weekend") },
        { v: "week", l: t("onboarding.qualif.week", "1 semaine") },
        { v: "long", l: t("onboarding.qualif.long", "2 semaines +") },
      ],
    },
    {
      key: "company",
      label: t("onboarding.qualif.company", "Avec qui ?"),
      options: [
        { v: "solo", l: t("onboarding.qualif.solo", "Seul·e") },
        { v: "couple", l: t("onboarding.qualif.couple", "En couple") },
        { v: "family", l: t("onboarding.qualif.family", "En famille") },
        { v: "friends", l: t("onboarding.qualif.friends", "Entre amis") },
      ],
    },
  ];

  const set = (k: keyof OnboardingQualif, v: string) =>
    setQ((prev) => ({ ...prev, [k]: v as never }));

  const complete = groups.every((g) => !!q[g.key]);

  const next = () => {
    setLocalOnboarding({ qualif: q, step: "signup" });
    navigate("/onboarding/signup");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/onboarding/besoin")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back", "Retour")}
        </button>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("onboarding.stepOf", "Étape {{n}} / 4", { n: 2 })}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
          {t("onboarding.qualif.title", "Parlez-nous vite de vous.")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("onboarding.qualif.help", "Trois clics pour personnaliser vos cartes suivantes.")}
        </p>

        <div className="mt-8 space-y-8">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="mb-3 text-sm font-semibold">{g.label}</div>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const active = q[g.key] === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => set(g.key, o.v)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      {o.l}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <Button
            onClick={next}
            disabled={!complete}
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

export default Qualif;
