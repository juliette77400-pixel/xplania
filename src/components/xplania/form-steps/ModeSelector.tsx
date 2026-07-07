import { Zap, Sparkles, Crown, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export type PlanMode = "quick" | "custom" | "tailored";

interface Props {
  onSelect: (mode: PlanMode) => void;
}

const MODE_IDS: { id: PlanMode; icon: React.ReactNode; badge?: string }[] = [
  { id: "quick", icon: <Zap className="w-5 h-5" /> },
  { id: "custom", icon: <Sparkles className="w-5 h-5" />, badge: "popular" },
  { id: "tailored", icon: <Crown className="w-5 h-5" /> },
];

const ModeSelector = ({ onSelect }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-foreground">{t("travelForm.modeSelector.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("travelForm.modeSelector.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {MODE_IDS.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelect(mode.id)}
            aria-label={`${t(`travelForm.modeSelector.${mode.id}.title`)} — ${t(`travelForm.modeSelector.${mode.id}.duration`)}`}
            className={`group relative flex min-h-[250px] flex-col gap-3 rounded-2xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${mode.id === "custom" ? "border-primary/50 bg-primary/[.06] shadow-[0_12px_35px_hsl(var(--primary)/.08)]" : "border-border bg-card/50 hover:border-primary/40"}`}
          >
            {mode.badge && (
              <span className="absolute -top-2 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full gradient-button text-primary-foreground">
                {t("travelForm.modeSelector.popular")}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-button flex items-center justify-center text-primary-foreground shrink-0">
                {mode.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground leading-tight">{t(`travelForm.modeSelector.${mode.id}.title`)}</p>
                <p className="text-xs text-muted-foreground">{t(`travelForm.modeSelector.${mode.id}.duration`)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t(`travelForm.modeSelector.${mode.id}.description`)}</p>
            <ul className="space-y-1 mt-auto">
              {(["h1", "h2", "h3"] as const).map((h) => (
                <li key={h} className="text-xs text-foreground/80 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {t(`travelForm.modeSelector.${mode.id}.${h}`)}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center text-sm font-semibold text-primary">
              {t("travelForm.modeSelector.choose")} <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
