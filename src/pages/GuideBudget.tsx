import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RotateCcw, Check, FileDown } from "lucide-react";
import { exportBudgetPdf } from "@/lib/budget-pdf";
import { useTravelStore } from "@/stores/useTravelStore";
import { toast } from "sonner";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import QuotaBanner from "@/components/shared/QuotaBanner";
import UpgradeDialog from "@/components/shared/UpgradeDialog";
import { useQuota } from "@/hooks/useQuota";
import { useHydrateActiveTrip } from "@/hooks/useHydrateActiveTrip";

import BudgetHero from "@/components/budget/BudgetHero";
import TripSummaryDashboard from "@/components/budget/TripSummaryDashboard";
import BudgetConfig from "@/components/budget/BudgetConfig";
import BudgetGenerationAnim, { STEPS } from "@/components/budget/BudgetGenerationAnim";
import BudgetAiResult from "@/components/budget/BudgetAiResult";
import BudgetForecast, { defaultCategories, type BudgetCategory } from "@/components/budget/BudgetForecast";
import ExpenseTracker from "@/components/budget/ExpenseTracker";
import BudgetCharts from "@/components/budget/BudgetCharts";
import BudgetAlerts from "@/components/budget/BudgetAlerts";
import BudgetSavingTips from "@/components/budget/BudgetSavingTips";
import AddExpenseForm, { type Expense } from "@/components/budget/AddExpenseForm";
import BudgetOnboardingChat from "@/components/budget/BudgetOnboardingChat";
import { suggestCategoryAmount, buildAdjustmentExplanation, type CategoryKey } from "@/lib/cost-of-living";

/* =============================================================================
 * DEV NOTE — Item 6: Bank-transaction integration feasibility (research only)
 * -----------------------------------------------------------------------------
 * Goal: auto-import real bank transactions into Xplania expenses.
 *
 * Viable EU/FR providers under PSD2:
 *   • Powens (ex-Budget Insight) — French aggregator, well-documented OAuth2/Webview
 *     flow. Pricing per active connection. Strong coverage of FR banks.
 *   • GoCardless Bank Account Data (ex-Nordigen) — free tier, EU-wide PSD2
 *     coverage, 90-day end-user agreement renewals required by law.
 *   • Tink (Visa) — premium, enterprise-grade.
 *   • Plaid — strong in US/UK, limited FR coverage.
 *
 * PSD2 / DSP2 constraints:
 *   • Strong Customer Authentication (SCA) every 90 days max.
 *   • Cannot store user banking credentials; only access tokens.
 *   • Must be a licensed AISP, OR rely on the provider's AISP license
 *     (most aggregators above resell it).
 *   • GDPR: explicit consent, right to revoke, EU data residency.
 *
 * Lovable stack feasibility:
 *   • OAuth callback: Supabase Edge Function (Deno) can handle the redirect
 *     and token exchange; tokens stored in a dedicated table with RLS.
 *   • Polling: a cron Edge Function fetches transactions and upserts them
 *     into a `bank_transactions` table, then the user matches them to
 *     Xplania expenses (or auto-match by date + amount + category).
 *   • Secrets: client_id / client_secret stored via supabase secrets
 *     (LOVABLE_SECRET_*).
 *
 * Risks before shipping:
 *   • Legal review for AISP delegation contract.
 *   • Onboarding friction (SCA every 90 days hurts retention).
 *   • Costs scale with active users on Powens/Tink.
 *
 * Decision: defer implementation. Keep manual + AI-classification as the
 * primary flow. Re-evaluate when premium tier has paying users.
 * =============================================================================
 */

const STORAGE_PREFIX = "xplania-budget-state";

const GuideBudgetPage = () => {
  useHydrateActiveTrip();
  const { tripData, recommendations } = useTravelStore();
  const { t, i18n } = useTranslation();
  const destination = tripData?.destination || "Paris";
  const days = tripData?.duration ? parseInt(tripData.duration) || 5 : 5;
  const userBudget = tripData?.totalBudget || 820;
  const travelers = useMemo(() => {
    const child = tripData?.childrenCount ?? 0;
    return Math.max(1, 1 + child);
  }, [tripData?.childrenCount]);

  const storageKey = `${STORAGE_PREFIX}::${destination}::${tripData?.departureDate || "na"}`;

  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [categories, setCategories] = useState<BudgetCategory[]>(defaultCategories);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [regenCount, setRegenCount] = useState(0);
  const [activeBudgetSection, setActiveBudgetSection] = useState<"analysis" | "forecast" | "tracker" | "charts" | "tips">("analysis");
  const [generatedContextKey, setGeneratedContextKey] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hydratedFromStorage, setHydratedFromStorage] = useState(false);
  const { reached, consume } = useQuota("budget");
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportBudgetPdf({
        destination,
        tripData,
        days,
        travelers,
        totalBudget: categories.reduce((s, c) => s + c.planned, 0) || userBudget,
        categories,
        expenses,
        locale,
        chartElement: chartRef.current,
        t,
      });
      toast.success(t("budget.pdf.success"));
    } catch (e) {
      console.error(e);
      toast.error(t("budget.pdf.error"));
    } finally {
      setIsExporting(false);
    }
  }, [destination, tripData, days, travelers, categories, expenses, locale, userBudget, t]);

  const totalBudget = categories.reduce((s, c) => s + c.planned, 0) || userBudget;
  const locale: "fr" | "en" = i18n.language.startsWith("en") ? "en" : "fr";
  const budgetContextKey = `${destination}|${days}|${userBudget}|${travelers}|${tripData?.departureDate || ""}`;

  // Hydrate from localStorage once per storageKey
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.hasGenerated && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          setCategories(parsed.categories);
          setExpenses(Array.isArray(parsed.expenses) ? parsed.expenses : []);
          setHasGenerated(true);
          setGeneratedContextKey(parsed.generatedContextKey || "");
          setRegenCount(parsed.regenCount || 0);
          setLastSavedAt(parsed.savedAt || null);
        }
      }
    } catch {
      /* ignore */
    }
    setHydratedFromStorage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist whenever state changes (auto-save), independent of focus/keyboard
  useEffect(() => {
    if (!hydratedFromStorage || !hasGenerated) return;
    try {
      const savedAt = Date.now();
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          hasGenerated,
          categories,
          expenses,
          regenCount,
          generatedContextKey,
          savedAt,
        })
      );
      setLastSavedAt(savedAt);
    } catch {
      /* ignore */
    }
  }, [categories, expenses, hasGenerated, hydratedFromStorage, regenCount, generatedContextKey, storageKey]);

  const monthLabel = useMemo(() => {
    const ref = tripData?.departureDate ? new Date(tripData.departureDate) : new Date();
    return ref.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "long" });
  }, [tripData?.departureDate, locale]);

  /** Apply realistic, destination-aware AI suggestions with explanations. */
  const recomputeAiSuggestions = useCallback(
    (cats: BudgetCategory[]): BudgetCategory[] =>
      cats.map((c) => {
        const suggested = suggestCategoryAmount(c.key as CategoryKey, c.planned, {
          destination,
          days,
          travelers,
        });
        return {
          ...c,
          aiSuggested: suggested,
          aiExplanation: buildAdjustmentExplanation(c.key as CategoryKey, destination, days, monthLabel, locale),
        };
      }),
    [destination, days, travelers, monthLabel, locale]
  );

  const buildTripAwareCategories = useCallback((): BudgetCategory[] => {
    const raw = defaultCategories.map((c) => {
      const rec = recommendations?.budgetBreakdown?.find((item) => {
        const name = String(item.category || "").toLowerCase();
        if (c.key === "accommodation") return /h[eé]bergement|hotel|stay|accommodation|logement/.test(name);
        if (c.key === "localTransport") return /transport|metro|m[eé]tro|bus|train|taxi/.test(name);
        if (c.key === "activities") return /activit|visit|visite|museum|mus[eé]e|sortie/.test(name);
        if (c.key === "food") return /food|repas|restaurant|nourriture|meal|gastronomie/.test(name);
        if (c.key === "shopping") return /shopping|souvenir|achat/.test(name);
        return /extra|impr[eé]vu|unexpected|misc/.test(name);
      });
      const base = typeof rec?.amount === "number" && rec.amount > 0
        ? rec.amount
        : suggestCategoryAmount(c.key as CategoryKey, c.planned, { destination, days, travelers });
      return { ...c, planned: Math.max(1, Math.round(base)), spent: 0 };
    });

    const targetTotal = Number(userBudget) > 0 ? Number(userBudget) : raw.reduce((sum, c) => sum + c.planned, 0);
    const rawTotal = raw.reduce((sum, c) => sum + c.planned, 0) || 1;
    let allocated = 0;

    return recomputeAiSuggestions(raw.map((c, index) => {
      const planned = index === raw.length - 1
        ? Math.max(1, Math.round(targetTotal - allocated))
        : Math.max(1, Math.round((c.planned / rawTotal) * targetTotal));
      allocated += planned;
      return { ...c, planned };
    }));
  }, [days, destination, recommendations?.budgetBreakdown, recomputeAiSuggestions, travelers, userBudget]);

  useEffect(() => {
    if (!hydratedFromStorage) return;
    if (!hasGenerated && tripData?.destination) {
      setCategories(buildTripAwareCategories());
    }
  }, [buildTripAwareCategories, hasGenerated, hydratedFromStorage, tripData?.destination]);

  useEffect(() => {
    if (hasGenerated && generatedContextKey && generatedContextKey !== budgetContextKey) {
      setCategories(buildTripAwareCategories());
      setGeneratedContextKey(budgetContextKey);
    }
  }, [budgetContextKey, buildTripAwareCategories, generatedContextKey, hasGenerated]);

  const runGeneration = useCallback(async () => {
    if (isGenerating) return;
    if (reached) { setShowUpgrade(true); return; }
    consume();
    setIsGenerating(true);
    setGenStep(0);
    try {
      for (let i = 0; i < STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, 450));
        setGenStep(i + 1);
      }
      setCategories(buildTripAwareCategories());
      setGeneratedContextKey(budgetContextKey);
      setHasGenerated(true);
      setRegenCount((n) => n + 1);
      toast.success(t("guideBudget.toastGenerated"));
    } finally {
      setIsGenerating(false);
    }
  }, [t, reached, consume, buildTripAwareCategories, budgetContextKey, isGenerating]);

  const handleRegenerate = useCallback(async () => {
    toast.loading(t("guideBudget.toastRecalc"), { id: "regen" });
    setIsGenerating(true);
    setGenStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setGenStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 300));
    setCategories(buildTripAwareCategories());
    setGeneratedContextKey(budgetContextKey);
    setIsGenerating(false);
    setRegenCount((n) => n + 1);
    toast.success(t("guideBudget.toastRecalcDone"), { id: "regen" });
  }, [t, buildTripAwareCategories, budgetContextKey]);

  const handleAiAdjust = (idx: number) => {
    setCategories((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, planned: c.aiSuggested } : c))
    );
    const label = t(`budget.categories.${categories[idx].key}`, { defaultValue: categories[idx].key });
    toast.success(t("guideBudget.toastAdjusted", { key: label }));
  };

  const handleUpdateCategory = (idx: number, updates: Partial<BudgetCategory>) => {
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, ...updates } : c)));
  };

  const handleUpdateTotalBudget = (nextTotal: number) => {
    setCategories((prev) => {
      const currentTotal = prev.reduce((sum, c) => sum + c.planned, 0) || 1;
      let allocated = 0;
      return prev.map((c, index) => {
        const planned = index === prev.length - 1
          ? Math.max(0, nextTotal - allocated)
          : Math.max(0, Math.round((c.planned / currentTotal) * nextTotal));
        allocated += planned;
        return {
        ...c,
        planned,
        };
      });
    });
    toast.success(t("budget.aiResultTotalUpdated"));
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [...prev, expense]);
    setCategories((prev) =>
      prev.map((c) =>
        c.key === expense.category ? { ...c, spent: c.spent + expense.amount } : c
      )
    );
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target) {
        setCategories((cats) =>
          cats.map((c) =>
            c.key === target.category ? { ...c, spent: Math.max(0, c.spent - target.amount) } : c
          )
        );
      }
      return prev.filter((e) => e.id !== id);
    });
  };

  const scrollToSection = (name: "analysis" | "forecast" | "tracker" | "charts" | "tips") => {
    const el = document.querySelector(`[data-budget-section="${name}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!hasGenerated) return;
    const sections = ["analysis", "forecast", "tracker", "charts", "tips"] as const;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const section = visible?.target.getAttribute("data-budget-section") as typeof sections[number] | null;
        if (section) setActiveBudgetSection(section);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-20% 0px -45% 0px" }
    );
    sections.forEach((section) => {
      const el = document.querySelector(`[data-budget-section="${section}"]`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [hasGenerated]);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <QuotaBanner tool="budget" toolLabel="Budget" />
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} toolName="Budget" />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <BudgetHero onGenerate={runGeneration} isGenerating={isGenerating} hasGenerated={hasGenerated} />

        {!hasGenerated && !isGenerating && (
          <TripSummaryDashboard tripData={tripData} />
        )}

        <AnimatePresence>
          {isGenerating && <BudgetGenerationAnim isGenerating={isGenerating} currentStep={genStep} />}
        </AnimatePresence>

        <AnimatePresence>
          {hasGenerated && !isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 pb-12"
            >
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {lastSavedAt
                      ? t("budget.autoSavedAt", {
                          time: new Date(lastSavedAt).toLocaleTimeString(
                            locale === "fr" ? "fr-FR" : "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          ),
                        })
                      : t("budget.autoSaved")}
                  </span>
                </div>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("guideBudget.regenerate")}
                </motion.button>
              </div>

              <BudgetConfig tripData={tripData} />
              <BudgetAiResult
                totalBudget={totalBudget}
                days={days}
                destination={destination}
                onTotalBudgetChange={handleUpdateTotalBudget}
              />
              <BudgetForecast
                totalBudget={totalBudget}
                categories={categories}
                onUpdateCategory={handleUpdateCategory}
                onAiAdjust={handleAiAdjust}
                isLoading={isGenerating}
              />
              <AddExpenseForm onAdd={handleAddExpense} />
              <ExpenseTracker categories={categories} expenses={expenses} onRemoveExpense={handleRemoveExpense} />
              <BudgetCharts categories={categories} days={days} totalBudget={totalBudget} expenses={expenses} />
              <BudgetAlerts categories={categories} destination={destination} />
              <BudgetSavingTips
                destination={destination}
                totalBudget={totalBudget}
                days={days}
                travelers={travelers}
                categories={categories}
                tripData={tripData}
              />


              <div className="flex justify-center">
                <Link
                  to="/guide-visa"
                  className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  {t("guideBudget.continueTo")}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasGenerated && (
        <BudgetOnboardingChat
          destination={destination}
          days={days}
          travelers={travelers}
          totalBudget={totalBudget}
          categories={categories}
          expenses={expenses}
          tripData={tripData}
          triggerKey={regenCount}
          activeSection={activeBudgetSection}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerate}
          onSuggestFocus={scrollToSection}
        />
      )}

      <QuickJump />
    </div>
  );
};

export default GuideBudgetPage;
