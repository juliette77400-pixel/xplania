import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertTriangle } from "lucide-react";
import type { BudgetCategory } from "./BudgetForecast";

interface Props {
  categories: BudgetCategory[];
}

const ExpenseTracker = ({ categories }: Props) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h2 className="text-lg font-bold text-foreground mb-1">{t("budget.trackerTitle")}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t("budget.trackerSubtitle")}</p>

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
              const warning = cat.spent / cat.planned > 0.8 && !overBudget;
              const Icon = cat.icon;
              const label = t(`budget.categories.${cat.key}`, { defaultValue: cat.key });

              return (
                <motion.tr
                  key={cat.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
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
                transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }}
                className={`${colors[i % colors.length]} h-full`}
                title={`${label}: ${Math.round(pct)}%`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {categories.slice(0, 4).map((cat, i) => {
            const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"];
            return (
              <div key={cat.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`w-2.5 h-2.5 rounded-full ${colors[i]}`} />
                {t(`budget.categories.${cat.key}`, { defaultValue: cat.key })}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ExpenseTracker;
