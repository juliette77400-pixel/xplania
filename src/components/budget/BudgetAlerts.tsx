import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertTriangle, TrendingDown, CheckCircle, Lightbulb, Trees, Utensils, Bus, Heart } from "lucide-react";
import type { BudgetCategory } from "./BudgetForecast";
import type { BudgetInsights, BudgetPlace } from "@/hooks/useBudgetInsights";

interface Props {
  categories: BudgetCategory[];
  destination: string;
  deals?: BudgetInsights["deals"] | null;
  loading?: boolean;
}

const BudgetAlerts = ({ categories, deals, loading }: Props) => {
  const { t } = useTranslation();

  // Build alerts using translated category labels
  const alerts: { message: string; type: "warning" | "danger" | "success" }[] = [];
  categories.forEach((cat) => {
    const ratio = cat.spent / cat.planned;
    const label = t(`budget.categories.${cat.key}`, { defaultValue: cat.key }).toLowerCase();
    if (ratio > 1) {
      alerts.push({ message: t("budget.alertsOver", { category: label }), type: "danger" });
    } else if (ratio > 0.8) {
      alerts.push({ message: t("budget.alertsHigh", { category: label }), type: "warning" });
    } else if (ratio < 0.5 && cat.spent > 0) {
      alerts.push({ message: t("budget.alertsLow", { category: label }), type: "success" });
    }
  });

  const tipSections = [
    { title: t("budget.alertsActivities"), icon: Trees, items: deals?.activities ?? [], color: "text-green-400" },
    { title: t("budget.alertsRestaurants"), icon: Utensils, items: deals?.restaurants ?? [], color: "text-orange-400" },
    { title: t("budget.alertsTransportAlt"), icon: Bus, items: deals?.transport ?? [], color: "text-blue-400" },
    { title: t("budget.alertsMood"), icon: Heart, items: deals?.mood ?? [], color: "text-pink-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 space-y-6"
    >
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">{t("budget.alertsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("budget.alertsSubtitle")}</p>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                alert.type === "danger"
                  ? "bg-destructive/10 border border-destructive/20"
                  : alert.type === "warning"
                  ? "bg-yellow-500/10 border border-yellow-500/20"
                  : "bg-green-500/10 border border-green-500/20"
              }`}
            >
              {alert.type === "danger" ? (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              ) : alert.type === "warning" ? (
                <TrendingDown className="w-4 h-4 text-yellow-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              )}
              <p className="text-sm text-foreground">{alert.message}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          {t("budget.alertsTipsTitle")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tipSections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <section.icon className={`w-4 h-4 ${section.color}`} />
                <h4 className="text-sm font-bold text-foreground">{section.title}</h4>
              </div>
              {loading && section.items.length === 0 ? (
                <div className="space-y-2"><div className="h-3 rounded bg-muted/50 animate-pulse" /><div className="h-3 w-2/3 rounded bg-muted/50 animate-pulse" /></div>
              ) : section.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("budget.dealsEmpty")}</p>
              ) : (
                <ul className="space-y-2.5">
                  {section.items.map((item: BudgetPlace, j: number) => (
                    <li key={j} className="text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-[11px] text-primary">📍 {[item.zone, item.city].filter(Boolean).join(" · ")}</p>
                      <p className="mt-0.5 leading-relaxed">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BudgetAlerts;
