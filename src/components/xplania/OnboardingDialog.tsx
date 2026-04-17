import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Compass, Rocket, ArrowRight, ArrowLeft } from "lucide-react";

const STORAGE_KEY = "xplania-onboarding-seen";

const slides = [
  {
    icon: Compass,
    badge: "Étape 1 / 3",
    title: "Dites-nous où vous rêvez d'aller",
    description:
      "Choisissez un mode rapide, personnalisé ou sur-mesure. On s'adapte à votre envie de détail — 3 questions ou 10, c'est vous qui décidez.",
  },
  {
    icon: Sparkles,
    badge: "Étape 2 / 3",
    title: "Notre IA prépare tout pour vous",
    description:
      "En quelques secondes, on génère un itinéraire personnalisé, votre liste de bagages, le budget estimé et les démarches visa adaptées à votre destination.",
  },
  {
    icon: Rocket,
    badge: "Étape 3 / 3",
    title: "Voyagez l'esprit léger",
    description:
      "Tout est centralisé : recommandations locales, conseils culturels, météo et budget. Vous n'avez plus qu'à profiter du voyage.",
  },
];

const OnboardingDialog = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Léger délai pour ne pas casser l'animation d'entrée de la home
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const isLast = step === slides.length - 1;
  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-background border-border">
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
              Passer
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
                  {slide.badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  {slide.title}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-7">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Aller à l'étape ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>
              {isLast ? (
                <button
                  onClick={close}
                  className="gradient-button px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  C'est parti
                </button>
              ) : (
                <button
                  onClick={() => setStep((s) => Math.min(slides.length - 1, s + 1))}
                  className="flex items-center gap-1.5 gradient-button px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Continuer
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

export default OnboardingDialog;
