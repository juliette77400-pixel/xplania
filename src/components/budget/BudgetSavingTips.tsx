import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PiggyBank, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { BudgetCategory } from "./BudgetForecast";
import type { TravelFormData } from "@/types/travel";

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
  tripData?: TravelFormData | null;
}

const CAT_EMOJI: Record<string, string> = {
  accommodation: "🏨",
  localTransport: "🚌",
  activities: "🎟️",
  food: "🍽️",
  shopping: "🛍️",
  extras: "✨",
};

const BudgetSavingTips = ({ destination, totalBudget, days, travelers, categories, tripData }: Props) => {
  const { t, i18n } = useTranslation();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signatureRef = useRef<string>("");

  const locale = i18n.language.startsWith("en") ? "en" : "fr";
  // Signature includes destination + budget to auto-refresh when they change.
  const breakdownSig = categories.map((c) => `${c.key}:${c.planned}`).join("/");
  const signature = `${destination}|${totalBudget}|${days}|${travelers}|${locale}|${breakdownSig}`;

  const buildFallbackTips = (): Tip[] => [
    {
      title: t("budget.savingTipsFallback.transportTitle"),
      body: t("budget.savingTipsFallback.transportBody", { destination }),
      category: "localTransport",
    },
    {
      title: t("budget.savingTipsFallback.foodTitle"),
      body: t("budget.savingTipsFallback.foodBody", { destination }),
      category: "food",
    },
    {
      title: t("budget.savingTipsFallback.activitiesTitle"),
      body: t("budget.savingTipsFallback.activitiesBody", { destination }),
      category: "activities",
    },
    {
      title: t("budget.savingTipsFallback.extrasTitle"),
      body: t("budget.savingTipsFallback.extrasBody", { destination }),
      category: "extras",
    },
  ];

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
        departureDate: tripData?.departureDate || "",
        returnDate: tripData?.returnDate || "",
        tripTypes: tripData?.tripTypes || [],
        spendingPriorities: tripData?.spendingPriorities || [],
        accommodationStanding: tripData?.accommodationStanding || "",
        organization: tripData?.organization || "",
        rhythm: tripData?.rhythm || "",
      };
      const invokePromise = supabase.functions.invoke("budget-tips", { body: payload });
      const timeoutPromise = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("budget_tips_timeout")), 15000)
      );
      const { data, error: fnError } = await Promise.race([invokePromise, timeoutPromise]);
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const nextTips = Array.isArray(data?.tips) ? data.tips.slice(0, 5) : [];
      setTips(nextTips.length > 0 ? nextTips : buildFallbackTips());
    } catch (e) {
      console.error("budget-tips failed", e);
      setTips(buildFallbackTips());
      setError(null);
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
