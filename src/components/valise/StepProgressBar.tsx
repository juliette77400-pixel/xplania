import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const stepKeys = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] as const;

interface StepProgressBarProps {
  currentStep: number;
}

const StepProgressBar = ({ currentStep }: StepProgressBarProps) => {
  const { t } = useTranslation();
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-start justify-center gap-1 sm:gap-2 min-w-max px-4 py-3">
        {stepKeys.map((key, i) => {
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;
          const label = t(`valise.stepsBar.${key}`);
          return (
            <div key={key} className="flex flex-col items-center gap-1.5 w-16 sm:w-20">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-[var(--glow-cyan)]"
                    : isActive
                    ? "bg-primary/30 text-primary"
                    : "bg-muted/50 text-muted-foreground/50"
                }`}
              >
                {i + 1}
              </motion.div>
              <p
                className={`text-[10px] text-center leading-tight font-medium ${
                  isCurrent ? "text-primary" : isActive ? "text-foreground/70" : "text-muted-foreground/40"
                }`}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgressBar;
