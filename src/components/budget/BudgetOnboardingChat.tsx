import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BarChart3, LineChart, MessageCircle, PiggyBank, RefreshCw, Sparkles, Target, X } from "lucide-react";

const STORAGE_KEY = "xplania-budget-onboarded-v1";

interface Props {
  destination: string;
  days: number;
  /** Bumped on each regenerate to re-trigger onboarding */
  triggerKey: string | number;
  activeSection: "analysis" | "forecast" | "tracker" | "charts" | "tips";
  isGenerating?: boolean;
  onRegenerate?: () => void;
  onSuggestFocus?: (focus: "analysis" | "forecast" | "tracker" | "charts" | "tips") => void;
}

const BudgetOnboardingChat = ({ destination, days, triggerKey, activeSection, isGenerating, onRegenerate, onSuggestFocus }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [stage, setStage] = useState<"welcome" | "suggestion" | "closed">("welcome");
  const focusOptions = ["analysis", "forecast", "tracker", "charts", "tips"] as const;
  const focusIcons = { analysis: Target, forecast: PiggyBank, tracker: BarChart3, charts: LineChart, tips: Sparkles } as const;

  useEffect(() => {
    const key = `${STORAGE_KEY}::${triggerKey}`;
    const seen = typeof window !== "undefined" && localStorage.getItem(key);
    if (!seen) {
      const timer = setTimeout(() => {
        setOpen(true);
        setStage("welcome");
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setOpen(true);
      setStage("suggestion");
    }
  }, [triggerKey]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(`${STORAGE_KEY}::${triggerKey}`, "1");
    } catch {
      /* ignore */
    }
  };

  const handleYes = () => {
    setStage("suggestion");
    onSuggestFocus?.("forecast");
  };

  const handleNo = () => {
    close();
  };

  if (!open) return null;

  const currentHelp = t(`budget.onboarding.sectionHelp.${activeSection}`, { destination, days });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-[min(360px,calc(100vw-2rem))] glass-card rounded-2xl shadow-2xl border border-primary/30 overflow-hidden"
      >
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-button flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">{t("budget.onboarding.title")}</span>
          </div>
          <button
            aria-label={t("common.close")}
            onClick={close}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {stage === "welcome" && (
            <>
              <p className="text-sm text-foreground leading-relaxed">
                {t("budget.onboarding.welcome", { destination, days })}
              </p>
              <p className="text-sm text-muted-foreground">{t("budget.onboarding.question")}</p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={handleYes}
                  className="flex-1 gradient-button text-primary-foreground text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("budget.onboarding.yes")}
                </button>
                <button
                  onClick={handleNo}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  {t("budget.onboarding.no")}
                </button>
              </div>
            </>
          )}

          {stage === "suggestion" && (
            <>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                {t(`budget.onboarding.sectionLabel.${activeSection}`)}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {currentHelp}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {focusOptions.map((focus) => (
                  <button
                    key={focus}
                    onClick={() => onSuggestFocus?.(focus)}
                    className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg transition-colors ${activeSection === focus ? "bg-primary/20 text-primary" : "bg-muted hover:bg-muted/80 text-foreground"}`}
                  >
                    {(() => {
                      const Icon = focusIcons[focus];
                      return <Icon className="w-3.5 h-3.5" />;
                    })()}
                    {t(`budget.onboarding.focus.${focus}`)}
                  </button>
                ))}
              </div>
              <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="w-full bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                {t("budget.onboarding.regenerate")}
              </button>
              <button
                onClick={close}
                className="w-full gradient-button text-primary-foreground text-sm font-semibold py-2 px-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                {t("budget.onboarding.gotIt")}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BudgetOnboardingChat;
