// ============= NEW FILE — Post-signup guided tour for authenticated users =============
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, Compass, BookOpen, MapPinned, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ICONS = [Sparkles, Compass, MapPinned, BookOpen];

const STEP_KEYS = [
  { titleKey: "onboardingTour.step1Title", descKey: "onboardingTour.step1Desc", cta: { to: "/app", labelKey: "onboardingTour.cta1" } },
  { titleKey: "onboardingTour.step2Title", descKey: "onboardingTour.step2Desc", cta: { to: "/discover", labelKey: "onboardingTour.cta2" } },
  { titleKey: "onboardingTour.step3Title", descKey: "onboardingTour.step3Desc", cta: { to: "/suivi", labelKey: "onboardingTour.cta3" } },
  { titleKey: "onboardingTour.step4Title", descKey: "onboardingTour.step4Desc", cta: { to: "/carnets", labelKey: "onboardingTour.cta4" } },
];

const storageKey = (uid: string) => `xplania-tour-seen-${uid}`;

const OnboardingTour = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Auto-open once per user after signup/first login
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(storageKey(user.id));
    if (!seen) {
      const tm = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(tm);
    }
  }, [user]);

  const close = () => {
    if (user) localStorage.setItem(storageKey(user.id), "1");
    setOpen(false);
    setStep(0);
  };

  if (!user) return null;

  const slide = STEP_KEYS[step];
  const Icon = ICONS[step] ?? Sparkles;
  const isLast = step === STEP_KEYS.length - 1;

  const handleCta = () => {
    if (slide.cta) {
      close();
      navigate(slide.cta.to);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-background border-border sm:rounded-3xl" aria-describedby="tour-description">
        <div className="relative">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="relative p-7 sm:p-9">
            <button
              onClick={close}
              className="absolute top-3 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("common.skip")}
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl gradient-button flex items-center justify-center mb-5">
                  <Icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary mb-3 uppercase tracking-wider">
                  {t("onboardingTour.stepLabel", { n: step + 1, total: STEP_KEYS.length })}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  {t(slide.titleKey)}
                </h2>
                <p id="tour-description" className="text-sm leading-6 text-muted-foreground max-w-md mx-auto">
                  {t(slide.descKey)}
                </p>
                {slide.cta && (
                  <button
                    onClick={handleCta}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t(slide.cta.labelKey)} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-2 mt-7">
              {STEP_KEYS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={t("onboardingTour.goTo", { n: i + 1 })}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("common.previous")}
              </button>
              {isLast ? (
                <button
                  onClick={close}
                  className="gradient-button px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {t("common.letsGo")}
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => Math.min(STEP_KEYS.length - 1, s + 1))}
                  className="flex items-center gap-1.5 gradient-button px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {t("common.continue")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
