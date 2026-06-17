import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, Edit3, Check, X } from "lucide-react";
import { useState } from "react";

interface Props {
  totalBudget: number;
  days: number;
  destination: string;
  onTotalBudgetChange: (amount: number) => void;
}

const BudgetAiResult = ({ totalBudget, days, destination, onTotalBudgetChange }: Props) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(totalBudget));

  const startEditing = () => {
    setDraft(String(totalBudget));
    setIsEditing(true);
  };

  const save = () => {
    const next = Math.max(1, Math.round(Number(draft) || totalBudget));
    onTotalBudgetChange(next);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(String(totalBudget));
    setIsEditing(false);
  };

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
        {isEditing ? (
          <span className="inline-flex items-center gap-1 align-middle mx-1">
            <input
              autoFocus
              type="number"
              min={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
              }}
              className="w-28 rounded-lg border border-primary bg-background px-2 py-1 text-right text-2xl font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={t("budget.aiResultEditTotalAria")}
            />
            <button onClick={save} className="p-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30" aria-label={t("common.save")}>
              <Check className="w-4 h-4" />
            </button>
            <button onClick={cancel} className="p-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80" aria-label={t("common.cancel")}>
              <X className="w-4 h-4" />
            </button>
          </span>
        ) : (
          <span className="text-2xl font-extrabold gradient-text">{totalBudget}€</span>
        )}{" "}
        {t("budget.aiResultFor")} <span className="font-bold text-foreground">{t("budget.configDays", { count: days })}</span> {t("budget.aiResultIn")}{" "}
        <span className="font-bold text-foreground">{destination}</span>.
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={startEditing}
        disabled={isEditing}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-foreground text-sm font-semibold hover:bg-muted/70 transition-colors"
      >
        <Edit3 className="w-4 h-4" />
        {t("budget.aiResultModify")}
      </motion.button>
    </motion.div>
  );
};

export default BudgetAiResult;
