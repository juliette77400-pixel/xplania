import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Home, Bus, Ticket, Utensils, ShoppingBag, AlertTriangle, Sparkles, Edit3, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface BudgetCategory {
  /** Stable key — must match keys in budget.categories */
  key: string;
  planned: number;
  aiSuggested: number;
  spent: number;
  icon: React.ElementType;
  color: string;
  /** Localized AI explanation for the current suggestion */
  aiExplanation?: string;
}

const defaultCategories: BudgetCategory[] = [
  { key: "accommodation", planned: 300, aiSuggested: 280, spent: 0, icon: Home, color: "text-blue-400" },
  { key: "localTransport", planned: 80, aiSuggested: 95, spent: 0, icon: Bus, color: "text-green-400" },
  { key: "activities", planned: 200, aiSuggested: 220, spent: 0, icon: Ticket, color: "text-purple-400" },
  { key: "food", planned: 150, aiSuggested: 140, spent: 0, icon: Utensils, color: "text-orange-400" },
  { key: "shopping", planned: 50, aiSuggested: 45, spent: 0, icon: ShoppingBag, color: "text-pink-400" },
  { key: "extras", planned: 30, aiSuggested: 25, spent: 0, icon: AlertTriangle, color: "text-yellow-400" },
  { key: "unexpected", planned: 10, aiSuggested: 15, spent: 0, icon: AlertTriangle, color: "text-red-400" },
];

interface Props {
  totalBudget: number;
  categories: BudgetCategory[];
  onUpdateCategory: (index: number, updates: Partial<BudgetCategory>) => void;
  onAiAdjust: (index: number) => void;
  isLoading: boolean;
}

const BudgetForecast = ({ totalBudget, categories, onUpdateCategory, onAiAdjust, isLoading }: Props) => {
  const { t } = useTranslation();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(String(categories[idx].planned));
  };

  const handleSave = (idx: number) => {
    const val = Math.max(0, parseInt(editValue) || 0);
    onUpdateCategory(idx, { planned: val });
    setEditingIdx(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
      data-budget-section="forecast"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("budget.forecastTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("budget.forecastSubtitle")}</p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const pct = totalBudget > 0 ? Math.round((cat.planned / totalBudget) * 100) : 0;
            const diff = cat.aiSuggested - cat.planned;
            const label = t(`budget.categories.${cat.key}`, { defaultValue: cat.key });

            return (
              <motion.div
                key={cat.key}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group shadow-md"
              >
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{label}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("budget.forecastPlanned")}</p>
                      {editingIdx === i ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="number"
                            min={0}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSave(i)}
                            onKeyDown={(e) => e.key === "Enter" && handleSave(i)}
                            className="w-20 bg-background border border-primary rounded px-2 py-0.5 text-sm font-bold text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label={t("budget.forecastEditAria", { category: label })}
                          />
                          <button
                            onClick={() => handleSave(i)}
                            aria-label={t("common.save")}
                            className="p-0.5 rounded bg-primary/20 hover:bg-primary/30 text-primary"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(i)}
                          title={t("budget.forecastEditTitle")}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1 border border-dashed border-transparent hover:border-primary/40 rounded px-1.5 py-0.5"
                        >
                          {cat.planned}€
                          <Edit3 className="w-3 h-3 opacity-60" />
                        </button>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("budget.forecastAi")}</p>
                      <p className={`text-sm font-bold ${diff > 0 ? "text-primary" : diff < 0 ? "text-green-400" : "text-foreground"}`}>
                        {cat.aiSuggested}€
                      </p>
                    </div>
                  </div>
                </div>

                <Progress value={pct} className="h-1.5 mb-2" />

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("budget.forecastPctTotal", { pct })} · {t("budget.forecastSpent", { amount: cat.spent })}
                  </span>
                  {diff !== 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onAiAdjust(i)}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {t("budget.forecastAiAdjust")} ({cat.aiSuggested}€)
                    </motion.button>
                  )}
                </div>

                {cat.aiExplanation && diff !== 0 && (
                  <p className="text-[11px] text-muted-foreground italic mt-1.5 flex items-start gap-1">
                    <Sparkles className="w-2.5 h-2.5 mt-0.5 text-primary/70 shrink-0" />
                    {cat.aiExplanation}
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { defaultCategories };
export default BudgetForecast;
