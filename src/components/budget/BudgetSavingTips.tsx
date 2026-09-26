import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PiggyBank, RefreshCw, Sparkles } from "lucide-react";
import type { BudgetInsights } from "@/hooks/useBudgetInsights";

interface Props {
  destination: string;
  tips?: BudgetInsights["tips"] | null;
  loading?: boolean;
  failed?: boolean;
  onRefresh: () => void;
}

const CAT_EMOJI: Record<string, string> = {
  accommodation: "🏨",
  localTransport: "🚌",
  activities: "🎟️",
  food: "🍽️",
  shopping: "🛍️",
  extras: "✨",
  flights: "✈️",
  insurance: "🛡️",
  connectivity: "📶",
  fees: "💳",
};

const BudgetSavingTips = ({ destination, tips, loading, failed, onRefresh }: Props) => {
  const { t } = useTranslation();
  const list = tips ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
      data-budget-section="tips"
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              {t("budget.savingTipsTitle")}
              <Sparkles className="w-4 h-4 text-primary" />
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("budget.savingTipsSubtitle", { destination })}
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("budget.savingTipsRefresh")}
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse h-24" />
          ))}
        </div>
      )}

      {!loading && list.length === 0 && (
        <p className="text-sm text-muted-foreground">{t(failed ? "budget.savingTipsError" : "budget.savingTipsEmpty")}</p>
      )}

      {!loading && list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map((tip, i) => (
            <motion.div
              key={`${tip.title}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="text-xl leading-none">{CAT_EMOJI[tip.category] || "💡"}</span>
                <h3 className="text-sm font-bold text-foreground">{tip.title}</h3>
              </div>
              {(tip.zone || tip.city) && (
                <p className="text-xs text-primary mb-1">📍 {[tip.zone, tip.city].filter(Boolean).join(" · ")}</p>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BudgetSavingTips;
