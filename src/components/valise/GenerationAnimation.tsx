import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const STEP_KEYS = ["s1", "s2", "s3", "s4", "s5"] as const;
const EMOJIS = ["🗺️", "🌤️", "🏛️", "🎯", "🧳"];

interface GenerationAnimationProps {
  isGenerating: boolean;
  currentStep: number;
}

const GenerationAnimation = ({ isGenerating, currentStep }: GenerationAnimationProps) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card rounded-2xl p-6 overflow-hidden relative"
        >
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
              <h3 className="text-base font-bold text-foreground">{t("valise.genTitle")}</h3>
            </div>

            <div className="space-y-3">
              {STEP_KEYS.map((key, i) => {
                const isDone = i < currentStep;
                const isCurrent = i === currentStep;
                const label = t(`valise.genSteps.${key}`);
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isDone ? "bg-primary/10" : isCurrent ? "bg-primary/5 border border-primary/20" : "bg-transparent"
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
                    <span className="text-sm mr-1">{EMOJIS[i]}</span>
                    <p className={`text-sm font-medium ${isDone || isCurrent ? "text-foreground" : "text-muted-foreground/40"}`}>
                      {label}
                    </p>
                    {isDone && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-auto text-[10px] text-primary font-medium"
                      >
                        {t("valise.genDone")}
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentStep / STEP_KEYS.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-right mt-1">
              {Math.round((currentStep / STEP_KEYS.length) * 100)}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const STEPS = STEP_KEYS.map((_, i) => ({ label: "", emoji: EMOJIS[i] }));
export { STEPS };
export default GenerationAnimation;
