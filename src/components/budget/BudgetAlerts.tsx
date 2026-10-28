import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertTriangle, TrendingDown, CheckCircle, Lightbulb, Trees, Utensils, Bus, Heart, RefreshCw, Loader2 } from "lucide-react";
import type { BudgetCategory } from "./BudgetForecast";
import type { BudgetInsights, InsightsErrorKind } from "@/hooks/useBudgetInsights";
import { budgetAlerts, prioritizeDeals, MAX_OPTIMISATIONS, type DealGroup } from "@/lib/budget-priorities";

interface Props {
  categories: BudgetCategory[];
  destination: string;
  deals?: BudgetInsights["deals"] | null;
  loading?: boolean;
  /** Why the AI ideas failed, if they did. */
  errorKind?: InsightsErrorKind | null;
  onRetry?: () => void;
  /** Asks for new optimisation ideas only (one Budget try). */
  onRegenerate?: () => void;
  regenerating?: boolean;
  /** The last regeneration found nothing genuinely new. */
  noNew?: boolean;
  regenError?: InsightsErrorKind | null;
}

const GROUP_ICON: Record<DealGroup, typeof Trees> = { activities: Trees, restaurants: Utensils, transport: Bus, mood: Heart };
const GROUP_LABEL: Record<DealGroup, string> = { activities: "budget.alertsActivities", restaurants: "budget.alertsRestaurants", transport: "budget.alertsTransportAlt", mood: "budget.alertsMood" };
const MAX_ALERTS = 3;

const BudgetAlerts = ({ categories, deals, loading, errorKind, onRetry, onRegenerate, regenerating, noNew, regenError }: Props) => {
  const { t } = useTranslation();
  const alerts = budgetAlerts(categories);
  const shownAlerts = alerts.slice(0, MAX_ALERTS);
  const ideas = prioritizeDeals(deals, categories, MAX_OPTIMISATIONS);
  const busy = !!loading || !!regenerating;
  const label = (key: string) => t(`budget.categories.${key}`, { defaultValue: key }).toLowerCase();
  const msgKey = { danger: "budget.alertsOver", warning: "budget.alertsHigh", success: "budget.alertsLow" } as const;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">{t("budget.alertsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("budget.alertsSubtitle")}</p>
      </div>

      {/* Alerts: computed from planned vs spent, never generated. */}
      <section aria-labelledby="budget-alerts-real" className="space-y-2">
        <h3 id="budget-alerts-real" className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" aria-hidden />{t("budget.realAlertsTitle")}
        </h3>
        {shownAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("budget.realAlertsNone")}</p>
        ) : (
          shownAlerts.map((alert, i) => (
            <div
              key={alert.key}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                alert.type === "danger" ? "bg-destructive/10 border-destructive/20" : alert.type === "warning" ? "bg-warning/10 border-warning/20" : "bg-success/10 border-success/20"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {alert.type === "danger" ? <AlertTriangle className="w-4 h-4 text-destructive shrink-0" aria-hidden />
                : alert.type === "warning" ? <TrendingDown className="w-4 h-4 text-warning shrink-0" aria-hidden />
                : <CheckCircle className="w-4 h-4 text-success shrink-0" aria-hidden />}
              <p className="text-sm text-foreground">{t(msgKey[alert.type], { category: label(alert.key) })}</p>
            </div>
          ))
        )}
        {alerts.length > MAX_ALERTS && <p className="text-xs text-muted-foreground">{t("budget.realAlertsMore", { count: alerts.length - MAX_ALERTS })}</p>}
        <p className="text-[11px] text-muted-foreground">{t("budget.realAlertsNote")}</p>
      </section>

      {/* Optimisations: AI ideas, 3 at most, regenerated on demand. */}
      <section aria-labelledby="budget-optimisations">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 id="budget-optimisations" className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" aria-hidden />{t("budget.alertsTipsTitle")}
          </h3>
          {onRegenerate && ideas.length > 0 && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={busy}
              aria-busy={!!regenerating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden />}
              {regenerating ? t("budget.regenerating") : t("budget.regenerate")}
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-muted-foreground">{t("budget.dealsNote")} {onRegenerate && t("budget.regenerateCost")}</p>

        {noNew && !busy && <p role="status" className="mb-3 rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-foreground">{t("budget.regenerateNoNew")}</p>}
        {(regenError || (errorKind && !loading)) && (
          <div role="alert" className="mb-4 flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">{t(`budget.insightsError.${regenError || errorKind}`)}</p>
            {!regenError && onRetry && errorKind !== "quota" && (
              <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 self-start rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 sm:self-auto">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />{t("budget.insightsRetry")}
              </button>
            )}
          </div>
        )}

        {busy && ideas.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-3" role="status" aria-label={t("budget.regenerating")}>
            {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : ideas.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("budget.dealsEmpty")}</p>
        ) : (
          <ul className={`grid gap-3 sm:grid-cols-3 transition-opacity ${regenerating ? "opacity-50" : ""}`}>
            {ideas.map((item) => {
              const Icon = GROUP_ICON[item.group];
              return (
                <li key={`${item.group}-${item.name}`} className="rounded-xl bg-muted/30 p-4 text-xs text-muted-foreground">
                  <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-background/60 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                    <Icon className="h-3 w-3 text-primary" aria-hidden />{t(GROUP_LABEL[item.group])}
                  </p>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-primary">📍 {[item.zone, item.city].filter(Boolean).join(" · ")}</p>
                  <p className="mt-1 leading-relaxed">{item.detail}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </motion.div>
  );
};

export default BudgetAlerts;
