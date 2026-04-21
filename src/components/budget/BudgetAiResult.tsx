import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, Edit3 } from "lucide-react";

interface Props {
  totalBudget: number;
  days: number;
  destination: string;
  onModify: () => void;
}

const BudgetAiResult = ({ totalBudget, days, destination, onModify }: Props) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{t("budget.aiResultTitle")}</h3>
      </div>

      <p className="text-base text-muted-foreground leading-relaxed mb-4">
        {t("budget.aiResultPrefix")}{" "}
        <span className="text-2xl font-extrabold gradient-text">{totalBudget}€</span>{" "}
        {t("budget.aiResultFor")} <span className="font-bold text-foreground">{t("budget.configDays", { count: days })}</span> {t("budget.aiResultIn")}{" "}
        <span className="font-bold text-foreground">{destination}</span>.
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onModify}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-foreground text-sm font-semibold hover:bg-muted/70 transition-colors"
      >
        <Edit3 className="w-4 h-4" />
        {t("budget.aiResultModify")}
      </motion.button>
    </motion.div>
  );
};

export default BudgetAiResult;
