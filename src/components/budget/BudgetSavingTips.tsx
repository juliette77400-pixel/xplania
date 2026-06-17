import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PiggyBank, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { BudgetCategory } from "./BudgetForecast";

interface Tip {
  title: string;
  body: string;
  category: string;
}

interface Props {
  destination: string;
  totalBudget: number;
  days: number;
  travelers: number;
  categories: BudgetCategory[];
}

const CAT_EMOJI: Record<string, string> = {
  accommodation: "🏨",
  localTransport: "🚌",
  activities: "🎟️",
  food: "🍽️",
  shopping: "🛍️",
  extras: "✨",
};

const BudgetSavingTips = ({ destination, totalBudget, days, travelers, categories }: Props) => {
  const { t, i18n } = useTranslation();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signatureRef = useRef<string>("");

  const locale = i18n.language.startsWith("en") ? "en" : "fr";
  const signature = `${destination}|${totalBudget}|${days}|${travelers}|${locale}`;

  const fetchTips = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        destination,
        totalBudget,
        days,
        travelers,
        locale,
        categories: categories.map((c) => ({ key: c.key, planned: c.planned, spent: c.spent })),
      };
      const { data, error: fnError } = await supabase.functions.invoke("budget-tips", { body: payload });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setTips(Array.isArray(data?.tips) ? data.tips.slice(0, 5) : []);
    } catch (e) {
      console.error("budget-tips failed", e);
      setError(t("budget.savingTipsError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!destination) return;
    if (signatureRef.current === signature) return;
    signatureRef.current = signature;
    fetchTips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
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
          onClick={fetchTips}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("budget.savingTipsRefresh")}
        </button>
      </div>

      {loading && tips.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse h-24" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && tips.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("budget.savingTipsEmpty")}</p>
      )}

      {tips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xl leading-none">{CAT_EMOJI[tip.category] || "💡"}</span>
                <h3 className="text-sm font-bold text-foreground">{tip.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BudgetSavingTips;
