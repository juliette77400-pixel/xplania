import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LuggageMode } from "./LuggageModes";

interface AiTipCardProps {
  mode: LuggageMode;
  isLoading?: boolean;
}

// Translation keys live under valise.aiTips.<mode>.{title,tip}; emojis stay inline
const emojis: Record<LuggageMode, string> = {
  minimaliste: "🎒", confort: "✨", stylée: "👗", aventure: "🧭",
  business: "💼", photo: "📸", randonnée: "🥾", plage: "🏖️",
  roadtrip: "🚗", urbain: "🏙️", luxe: "💎",
};

const AiTipCard = ({ mode, isLoading }: AiTipCardProps) => {
  const { t } = useTranslation();
  const title = t(`valise.aiTips.${mode}.title`, { defaultValue: t("valise.aiTipFallbackTitle") });
  const tip = t(`valise.aiTips.${mode}.tip`, { defaultValue: "" });

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-foreground">{t("valise.aiTipAnalyzing")}</p>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl p-5 flex items-start gap-4 shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 text-xl">
            {emojis[mode]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">{title}</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiTipCard;
