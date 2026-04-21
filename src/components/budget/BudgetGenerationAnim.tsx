import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, Brain, Calculator, TrendingUp, CheckCircle } from "lucide-react";

const STEP_ICONS = [Brain, Calculator, TrendingUp, CheckCircle] as const;
// Compatibility export — array length still used by callers as STEPS.length
const STEPS = STEP_ICONS.map(() => null);

interface Props {
  isGenerating: boolean;
  currentStep: number;
}

const BudgetGenerationAnim = ({ isGenerating, currentStep }: Props) => {
  const { t } = useTranslation();
  if (!isGenerating) return null;

  const stepKeys = ["s1", "s2", "s3", "s4"] as const;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card rounded-2xl p-8 text-center space-y-6"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 mx-auto rounded-2xl gradient-button flex items-center justify-center"
      >
        <Sparkles className="w-8 h-8 text-primary-foreground" />
      </motion.div>

      <div className="space-y-3 max-w-md mx-auto">
        {stepKeys.map((key, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          const Icon = STEP_ICONS[i];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: isDone || isActive ? 1 : 0.3,
                x: 0,
              }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive ? "bg-primary/10 border border-primary/30" : isDone ? "bg-muted/30" : ""
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isDone ? "text-green-400" : isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                {t(`budget.genSteps.${key}`)}
              </span>
              {isDone && <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />}
            </motion.div>
          );
        })}
      </div>

      <div className="h-2 rounded-full bg-muted/50 overflow-hidden max-w-xs mx-auto">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / stepKeys.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
};

export { STEPS };
export default BudgetGenerationAnim;
