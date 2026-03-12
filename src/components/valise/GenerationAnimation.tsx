import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";

const STEPS = [
  { label: "Analyse du voyage…", emoji: "🗺️" },
  { label: "Analyse météo…", emoji: "🌤️" },
  { label: "Analyse culturelle…", emoji: "🏛️" },
  { label: "Analyse des activités…", emoji: "🎯" },
  { label: "Optimisation de la valise…", emoji: "🧳" },
];

interface GenerationAnimationProps {
  isGenerating: boolean;
  currentStep: number;
}

const GenerationAnimation = ({ isGenerating, currentStep }: GenerationAnimationProps) => (
  <AnimatePresence>
    {isGenerating && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-2xl p-6 overflow-hidden relative"
      >
        {/* Animated background shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <h3 className="text-base font-bold text-foreground">Génération IA en cours…</h3>
          </div>

          <div className="space-y-3">
            {STEPS.map((step, i) => {
              const isDone = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isDone
                      ? "bg-primary/10"
                      : isCurrent
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-transparent"
                  }`}
                >
                  {isDone ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    </motion.div>
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/20 shrink-0" />
                  )}
                  <span className="text-sm mr-1">{step.emoji}</span>
                  <p className={`text-sm font-medium ${isDone || isCurrent ? "text-foreground" : "text-muted-foreground/40"}`}>
                    {step.label}
                  </p>
                  {isDone && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-auto text-[10px] text-primary font-medium"
                    >
                      Terminé
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-right mt-1">
            {Math.round((currentStep / STEPS.length) * 100)}%
          </p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const STEPS_EXPORT = STEPS;
export { STEPS_EXPORT as STEPS };
export default GenerationAnimation;
