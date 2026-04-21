import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PiggyBank } from "lucide-react";

const TIP_KEYS = ["local", "transit", "museum", "lastMin", "shop", "breakfast", "walk", "pass"] as const;
const EMOJIS: Record<(typeof TIP_KEYS)[number], string> = {
  local: "🍜",
  transit: "🚌",
  museum: "🏛️",
  lastMin: "🎟️",
  shop: "🛍️",
  breakfast: "🥐",
  walk: "🚶",
  pass: "🎫",
};

const BudgetTips = () => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <PiggyBank className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("budget.tipsTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("budget.tipsSubtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TIP_KEYS.map((key, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors shadow-md cursor-default"
          >
            <span className="text-2xl block mb-2">{EMOJIS[key]}</span>
            <h3 className="text-sm font-bold text-foreground mb-1">{t(`budget.tips.${key}.t`)}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{t(`budget.tips.${key}.d`)}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default BudgetTips;
