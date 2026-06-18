import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ValiseSummaryProps {
  totalItems: number;
  checkedItems: number;
  categoriesCount: number;
  remainingByCategory?: Record<string, number>;
}

const ValiseSummary = ({ totalItems, checkedItems, categoriesCount, remainingByCategory }: ValiseSummaryProps) => {
  const { t } = useTranslation();
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const remaining = Math.max(totalItems - checkedItems, 0);

  // Dynamic insights based on actual state
  const insights: string[] = [];
  if (pct === 100) {
    insights.push(t("valise.summaryDyn.allChecked"));
  } else if (pct === 0) {
    insights.push(t("valise.summaryDyn.empty"));
  } else {
    insights.push(t("valise.summaryDyn.progress", { pct, remaining }));
  }
  insights.push(t("valise.summaryDyn.categories", { count: categoriesCount }));

  if (remainingByCategory) {
    const topMissing = Object.entries(remainingByCategory)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1);
    if (topMissing.length > 0) {
      insights.push(t("valise.summaryDyn.topMissing", { cat: topMissing[0][0], count: topMissing[0][1] }));
    }
  }
  if (pct >= 80 && pct < 100) {
    insights.push(t("valise.summaryDyn.almostReady"));
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-foreground text-center mb-2">
          {t("valise.summaryTitle")}
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {t("valise.summarySubtitle")}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t("valise.summarySelected"), value: checkedItems },
            { label: t("valise.summaryCategories"), value: categoriesCount },
            { label: t("valise.summaryProgressPct"), value: `${pct}%` },
            { label: t("valise.summaryRemaining"), value: remaining },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-2xl font-bold gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">{t("valise.summaryInsights")}</h4>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <div className="text-center pb-8">
        <Link
          to="/#create"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("valise.backDashboard")}
        </Link>
      </div>
    </>
  );
};

export default ValiseSummary;
