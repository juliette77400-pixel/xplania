import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertTriangle, Receipt, Trash2 } from "lucide-react";
import type { BudgetCategory } from "./BudgetForecast";
import type { Expense } from "./AddExpenseForm";

interface Props {
  categories: BudgetCategory[];
  expenses?: Expense[];
  onRemoveExpense?: (id: string) => void;
}

const ExpenseTracker = ({ categories, expenses = [], onRemoveExpense }: Props) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";

  const totalPlanned = categories.reduce((s, c) => s + c.planned, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  const totalRest = totalPlanned - totalSpent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
      data-budget-section="tracker"
    >
      <h2 className="text-lg font-bold text-foreground mb-1">{t("budget.trackerTitle")}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t("budget.trackerSubtitle")}</p>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="p-3 rounded-xl bg-muted/40 text-center">
          <p className="text-xs text-muted-foreground">{t("budget.trackerTotalPlanned")}</p>
          <p className="text-lg font-bold text-foreground">{totalPlanned}€</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/40 text-center">
          <p className="text-xs text-muted-foreground">{t("budget.trackerTotalSpent")}</p>
          <p className="text-lg font-bold text-foreground">{totalSpent}€</p>
        </div>
        <div className={`p-3 rounded-xl text-center ${totalRest < 0 ? "bg-destructive/15" : "bg-green-500/15"}`}>
          <p className="text-xs text-muted-foreground">{t("budget.trackerTotalRest")}</p>
          <p className={`text-lg font-bold ${totalRest < 0 ? "text-destructive" : "text-green-400"}`}>{totalRest}€</p>
        </div>
      </div>

      {/* Per-category summary */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">{t("budget.trackerCategory")}</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">{t("budget.trackerPlanned")}</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">{t("budget.trackerSpent")}</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">{t("budget.trackerRest")}</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium">{t("budget.trackerStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => {
              const rest = cat.planned - cat.spent;
              const overBudget = rest < 0;
              const ratio = cat.planned > 0 ? cat.spent / cat.planned : 0;
              const warning = ratio > 0.8 && !overBudget;
              const Icon = cat.icon;
              const label = t(`budget.categories.${cat.key}`, { defaultValue: cat.key });

              return (
                <motion.tr
                  key={cat.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                      <span className="font-medium text-foreground">{label}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-foreground font-semibold">{cat.planned}€</td>
                  <td className="text-right py-3 px-2 text-foreground">{cat.spent}€</td>
                  <td className={`text-right py-3 px-2 font-semibold ${overBudget ? "text-destructive" : "text-foreground"}`}>
                    {rest}€
                  </td>
                  <td className="text-center py-3 px-2">
                    {overBudget ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-semibold">
                        <AlertTriangle className="w-3 h-3" /> {t("budget.trackerOver")}
                      </span>
                    ) : warning ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
                        <AlertTriangle className="w-3 h-3" /> {t("budget.trackerWarn")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" /> {t("budget.trackerOk")}
                      </span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent expenses list */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          {t("budget.trackerRecent", { count: expenses.length })}
        </h3>
        {expenses.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t("budget.trackerNoExpense")}</p>
        ) : (
          <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {[...expenses]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((exp) => {
                const cat = categories.find((c) => c.key === exp.category);
                const catLabel = t(`budget.categories.${exp.category}`, { defaultValue: exp.category });
                const dateStr = new Date(exp.date).toLocaleDateString(locale, {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <li
                    key={exp.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {cat && <cat.icon className={`w-3.5 h-3.5 ${cat.color} shrink-0`} />}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {exp.comment || catLabel}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {catLabel} · {dateStr}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">{exp.amount}€</span>
                    {onRemoveExpense && (
                      <button
                        onClick={() => onRemoveExpense(exp.id)}
                        aria-label={t("budget.trackerRemoveAria")}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">{t("budget.trackerSplit")}</h3>
        <div className="flex rounded-lg overflow-hidden h-4">
          {categories.map((cat, i) => {
            const total = categories.reduce((s, c) => s + c.planned, 0);
            const pct = total > 0 ? (cat.planned / total) * 100 : 0;
            const colors = [
              "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
              "bg-pink-500", "bg-yellow-500", "bg-red-500",
            ];
            const label = t(`budget.categories.${cat.key}`, { defaultValue: cat.key });
            return (
              <motion.div
                key={cat.key}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.4 + i * 0.06, duration: 0.6 }}
                className={`${colors[i % colors.length]} h-full`}
                title={`${label}: ${Math.round(pct)}%`}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ExpenseTracker;
