import { useTranslation } from "react-i18next";
import { Compass, Heart, Sparkles, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { key: "s1", Icon: Compass },
  { key: "s2", Icon: Heart },
  { key: "s3", Icon: Sparkles },
  { key: "s4", Icon: Rocket },
];

export default function JourneyIntro({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          {t("journeyIntro.kicker")}
        </p>
        <h1 className="text-center text-3xl font-bold text-foreground mb-3">{t("journeyIntro.title")}</h1>
        <p className="text-center text-muted-foreground mb-8">{t("journeyIntro.subtitle")}</p>

        <ol className="space-y-3 mb-8">
          {STEPS.map(({ key, Icon }, i) => (
            <li key={key} className="flex gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {i + 1}. {t(`journeyIntro.${key}.title`)}
                  {i === 1 && (
                    <span className="ml-2 text-xs font-medium text-muted-foreground">{t("journeyIntro.s2.time")}</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{t(`journeyIntro.${key}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>

        <Button onClick={onStart} className="w-full gradient-button" size="lg">
          {t("journeyIntro.cta")} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">{t("journeyIntro.note")}</p>
      </div>
    </div>
  );
}
