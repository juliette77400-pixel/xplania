import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle } from "lucide-react";

const STEPS = [
  "Analyse du voyage…",
  "Analyse météo…",
  "Analyse culturelle…",
  "Analyse des activités…",
  "Optimisation de la valise…",
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
        className="glass-card rounded-2xl p-6 space-y-3"
      >
        <h3 className="text-base font-bold text-foreground mb-4">🧠 Génération en cours…</h3>
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            {i < currentStep ? (
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
            ) : i === currentStep ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            )}
            <p className={`text-sm ${i <= currentStep ? "text-foreground" : "text-muted-foreground/50"}`}>
              {step}
            </p>
          </div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

export { STEPS };
export default GenerationAnimation;
