import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RotateCcw, Check, FileDown } from "lucide-react";
import { useTravelStore } from "@/stores/useTravelStore";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import QuotaBanner from "@/components/shared/QuotaBanner";
import UpgradeDialog from "@/components/shared/UpgradeDialog";
import CollapsibleSection from "@/components/shared/CollapsibleSection";
import { useQuota } from "@/hooks/useQuota";
import { useHydrateActiveTrip } from "@/hooks/useHydrateActiveTrip";
import { useBudgetInsights, type BudgetScenario } from "@/hooks/useBudgetInsights";

import BudgetHero from "@/components/budget/BudgetHero";
import TripSummaryDashboard from "@/components/budget/TripSummaryDashboard";
import ExampleResultPreview from "@/components/shared/ExampleResultPreview";
import BudgetConfig from "@/components/budget/BudgetConfig";
import BudgetGenerationAnim, { STEPS } from "@/components/budget/BudgetGenerationAnim";
import BudgetAiResult from "@/components/budget/BudgetAiResult";
import BudgetForecast, { defaultCategories, type BudgetCategory } from "@/components/budget/BudgetForecast";
import ExpenseTracker from "@/components/budget/ExpenseTracker";
const BudgetCharts = lazy(() => import("@/components/budget/BudgetCharts"));
import BudgetAlerts from "@/components/budget/BudgetAlerts";
import BudgetSavingTips from "@/components/budget/BudgetSavingTips";
import AddExpenseForm, { type Expense } from "@/components/budget/AddExpenseForm";
import BudgetOnboardingChat from "@/components/budget/BudgetOnboardingChat";
import CurrencyConverter from "@/components/shared/CurrencyConverter";
import MissingTripInfo from "@/components/shared/MissingTripInfo";
import { suggestCategoryAmount, buildAdjustmentExplanation, buildScenarios, type CategoryKey } from "@/lib/cost-of-living";
import BudgetKpis from "@/components/budget/BudgetKpis";
import BudgetRecommendations from "@/components/budget/BudgetRecommendations";
import BudgetSimulator from "@/components/budget/BudgetSimulator";
import BudgetConfirmDialog from "@/components/budget/BudgetConfirmDialog";
import BudgetIncomesForm from "@/components/budget/BudgetIncomes";
import { budgetRecommendations, changedLines, emptyIncomes, sanitizeIncomes, summarizeBudget, type BudgetIncomes, type BudgetLine } from "@/lib/budget-math";
import GuestSaveBanner from "@/components/shared/GuestSaveBanner";

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
  // "Paris" is only the historical storage-key fallback; it is never shown as the student's destination.
  const destination = tripData?.destination || "Paris";
  const days = tripData?.duration ? parseInt(tripData.duration) || 5 : 5;
  const userBudget = tripData?.totalBudget || 0;
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
  const [incomes, setIncomes] = useState<BudgetIncomes>(emptyIncomes);
  const [incomesGiven, setIncomesGiven] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [regenCount, setRegenCount] = useState(0);
  const [activeBudgetSection, setActiveBudgetSection] = useState<"analysis" | "forecast" | "tracker" | "charts" | "tips">("analysis");
  const [generatedContextKey, setGeneratedContextKey] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hydratedFromStorage, setHydratedFromStorage] = useState(false);
  const { reached, consume } = useQuota("budget");
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totalBudget = categories.reduce((s, c) => s + c.planned, 0) || userBudget;
  const locale: "fr" | "en" = i18n.language.startsWith("en") ? "en" : "fr";
  const insights = useBudgetInsights({
    enabled: hasGenerated,
    destination,
    totalBudget,
    days,
    travelers,
    locale,
    categories: categories.map((c) => ({ key: c.key, planned: c.planned, spent: c.spent })),
    tripData,
  });

  // Once AI scenarios arrive, the "realistic" split becomes the suggestion per category.
  useEffect(() => {
    const realistic = insights.data?.scenarios?.realistic;
    if (!realistic?.split?.length) return;
    const sc = insights.data!.scenarios;
    setCategories((prev) => prev.map((c) => {
      const amt = (k: "economy" | "realistic" | "comfort") => Math.round(sc[k]?.split?.find((x) => x.key === c.key)?.amount ?? 0);
      const r = amt("realistic");
      if (!r) return c;
      const line = locale === "en"
        ? `AI scenarios for ${destination}: economy ~€${amt("economy")} · realistic ~€${r} · comfort ~€${amt("comfort")}. The realistic one is the best value.`
        : `Scénarios IA pour ${destination} : éco ~${amt("economy")} € · réaliste ~${r} € · confort ~${amt("comfort")} €. Le réaliste offre le meilleur rapport qualité-prix.`;
      return { ...c, aiSuggested: r, aiExplanation: line };
    }));
  }, [insights.data, locale, destination]);

  // Any change that replaces several amounts waits for the student's confirmation.
  const [pending, setPending] = useState<{ title: string; description: string; confirmLabel: string; next: BudgetCategory[]; onDone?: () => void } | null>(null);

  const applyScenario = useCallback((sc: BudgetScenario) => {
    const next = categories.map((c) => {
      const a = sc.split?.find((x) => x.key === c.key)?.amount;
      return typeof a === "number" && a > 0 ? { ...c, planned: Math.round(a) } : c;
    });
    setPending({
      title: t("budget2.confirm.scenarioTitle"),
      description: t("budget2.confirm.scenarioDesc"),
      confirmLabel: t("budget.scenarioApply"),
      next,
      onDone: () => toast.success(t("budget.scenarioApplied")),
    });
  }, [categories, t]);

  // The estimate does not depend on the student's budget, so only stay facts are compared.
  const budgetContextKey = `${destination}|${days}|${travelers}|${tripData?.departureDate || ""}`;

  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      const { exportBudgetPdf } = await import("@/lib/budget-pdf");
      await exportBudgetPdf({
        destination,
        tripData,
        days,
        travelers,
        totalBudget,
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
  }, [destination, tripData, days, travelers, totalBudget, categories, expenses, locale, t]);


  // Hydrate from localStorage once per storageKey
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.hasGenerated && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          // Re-attach icon/color from defaults (functions don't survive JSON)
          const rehydrated: BudgetCategory[] = parsed.categories.map((c: Partial<BudgetCategory> & { key: string }) => {
            const def = defaultCategories.find((d) => d.key === c.key) || defaultCategories[0];
            return {
              ...def,
              ...c,
              icon: def.icon,
              color: def.color,
            } as BudgetCategory;
          });
          for (const def of defaultCategories) {
            if (!rehydrated.some((c) => c.key === def.key)) rehydrated.push({ ...def });
          }
          setCategories(rehydrated);
          setExpenses(Array.isArray(parsed.expenses) ? parsed.expenses : []);
          setIncomes(sanitizeIncomes(parsed.incomes));
          setIncomesGiven(!!parsed.incomes);
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
          ...(incomesGiven ? { incomes } : {}),
          regenCount,
          generatedContextKey,
          savedAt,
        })
      );
      setLastSavedAt(savedAt);
    } catch {
      /* ignore */
    }
  }, [categories, expenses, incomes, incomesGiven, hasGenerated, hydratedFromStorage, regenCount, generatedContextKey, storageKey]);

  // Email alert once when real spending reaches 80% of the planned budget.
  useEffect(() => {
    if (!hydratedFromStorage || !hasGenerated || totalBudget <= 0) return;
    const spent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    if (spent / totalBudget < 0.8) return;
    const flag = `${storageKey}::alert80`;
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, "1");
    import("@/integrations/supabase/client").then(({ supabase }) =>
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) { localStorage.removeItem(flag); return; }
        supabase.functions.invoke("budget-alert", {
          body: { budgetKey: storageKey, destination, spent, planned: totalBudget, lang: locale },
        }).then(({ error }) => { if (error) localStorage.removeItem(flag); });
      })
    );
  }, [expenses, totalBudget, hasGenerated, hydratedFromStorage, storageKey, destination, locale]);


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
        const sc = buildScenarios(suggested);
        const scLine = locale === "en"
          ? ` Scenarios: economy ~€${sc.economy} · realistic ~€${sc.realistic} · comfort ~€${sc.comfort}.`
          : ` Scénarios : éco ~${sc.economy} € · réaliste ~${sc.realistic} € · confort ~${sc.comfort} €.`;
        return {
          ...c,
          aiSuggested: suggested,
          aiExplanation: buildAdjustmentExplanation(c.key as CategoryKey, destination, days, monthLabel, locale) + scLine,
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
        if (c.key === "flights") return /vol|flight|avion|a[eé]rien|aller[- ]retour/.test(name);
        if (c.key === "insurance") return /assurance|insurance|sant[eé]|health/.test(name);
        if (c.key === "connectivity") return /sim|internet|data|t[eé]l[eé]phone|phone/.test(name);
        if (c.key === "fees") return /frais|fee|pourboire|tip|bank|banc/.test(name);
        if (c.key === "unexpected") return /impr[eé]vu|unexpected|misc/.test(name);
        return /extra/.test(name);
      });
      const base = typeof rec?.amount === "number" && rec.amount > 0
        ? rec.amount
        : suggestCategoryAmount(c.key as CategoryKey, 0, { destination, days, travelers });
      return { ...c, planned: Math.max(0, Math.round(base)), spent: 0 };
    });

    // The estimate comes from local costs only: it is NOT stretched to match the
    // student's budget, so "budget vs estimate" stays meaningful.
    return recomputeAiSuggestions(raw);
  }, [days, destination, recommendations?.budgetBreakdown, recomputeAiSuggestions, travelers]);

  useEffect(() => {
    if (!hydratedFromStorage) return;
    if (!hasGenerated && tripData?.destination) {
      setCategories(buildTripAwareCategories());
    }
  }, [buildTripAwareCategories, hasGenerated, hydratedFromStorage, tripData?.destination]);

  // The stay changed (length, budget, dates…): offer a new estimate, never replace amounts silently.
  const contextChanged = hasGenerated && !!generatedContextKey && generatedContextKey !== budgetContextKey;
  const askRecalculate = useCallback(() => {
    setPending({
      title: t("budget2.confirm.recalcTitle"),
      description: t("budget2.confirm.recalcDesc"),
      confirmLabel: t("budget2.confirm.recalcCta"),
      next: buildTripAwareCategories().map((c) => ({ ...c, spent: categories.find((x) => x.key === c.key)?.spent ?? 0 })),
      onDone: () => { setGeneratedContextKey(budgetContextKey); setRegenCount((n) => n + 1); toast.success(t("guideBudget.toastRecalcDone")); },
    });
  }, [buildTripAwareCategories, budgetContextKey, categories, t]);

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
      track("guide_generated", { guide: "budget" });
      toast.success(t("guideBudget.toastGenerated"));
    } finally {
      setIsGenerating(false);
    }
  }, [t, reached, consume, buildTripAwareCategories, budgetContextKey, isGenerating]);

  const handleRegenerate = askRecalculate;

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

  const lines: BudgetLine[] = categories.map((c) => ({ key: c.key, planned: c.planned, spent: c.spent }));
  const summary = summarizeBudget(lines, expenses, userBudget, days, incomes);
  const daysUntilDeparture = tripData?.departureDate ? Math.ceil((new Date(tripData.departureDate).getTime() - Date.now()) / 86_400_000) : null;
  const recommendationsList = budgetRecommendations(lines, summary, daysUntilDeparture, incomesGiven);
  const saveIncomes = (next: BudgetIncomes) => {
    setIncomes(next);
    setIncomesGiven(true);
    toast.success(t("budget2.incomes.saved"));
  };
  const applySimulation = (next: BudgetLine[]) => {
    setCategories((prev) => prev.map((c) => ({ ...c, planned: next.find((n) => n.key === c.key)?.planned ?? c.planned })));
    toast.success(t("budget2.sim.applied"));
  };

  const handleAddExpense = (expense: Expense) => {
    if (expenses.length === 0) track("guide_action", { module: "budget", action: "first_expense" });
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
    // Force-open the matching collapsible if needed before scrolling
    window.dispatchEvent(new CustomEvent("xpl:open-section", { detail: { id: name } }));
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-budget-section="${name}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
      <div className="px-4"><GuestSaveBanner /></div>
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} toolName="Budget" />

      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <BudgetHero onGenerate={runGeneration} isGenerating={isGenerating} hasGenerated={hasGenerated} destination={destination} days={days} initialBudget={userBudget} />
        <MissingTripInfo needs={["budget", "dates"]} />
        <p className="mx-auto mt-3 max-w-3xl rounded-xl border border-border bg-muted/40 px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
          {t("budget.disclaimerAdjust", { defaultValue: "Ce budget est une estimation que tu peux ajuster à tout moment. Revérifie toujours tes dépenses et les prix réels : Xplania t'aide, mais ne remplace pas tes propres vérifications." })}
        </p>

        {!hasGenerated && !isGenerating && (
          <>
            <ExampleResultPreview
              title={t("guidePreview.budget.title")}
              rows={[
                { label: t("guidePreview.budget.housing"), value: "~450 €" },
                { label: t("guidePreview.budget.food"), value: "~220 €" },
                { label: t("guidePreview.budget.transport"), value: "~90 €" },
                { label: t("guidePreview.budget.leisure"), value: "~120 €" },
              ]}
              note={t("guidePreview.budget.note")}
            />
            <TripSummaryDashboard tripData={tripData} />
          </>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-button text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4" />
                    {isExporting ? t("budget.pdf.exporting") : t("budget.pdf.exportButton")}
                  </motion.button>
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
              </div>

              {contextChanged && (
                <div role="status" className="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t("budget2.context.title")}</p>
                    <p className="text-xs text-muted-foreground">{t("budget2.context.body")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setGeneratedContextKey(budgetContextKey)} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">{t("budget2.context.keep")}</button>
                    <button type="button" onClick={askRecalculate} className="gradient-button rounded-xl px-3 py-2 text-sm font-semibold text-primary-foreground">{t("budget2.context.recalc")}</button>
                  </div>
                </div>
              )}
              <BudgetKpis summary={summary} />
              <BudgetRecommendations items={recommendationsList} />
              {/* Decision first; details folded below so the page stays short. */}
              {summary.months >= 1 && !incomesGiven ? (
                <BudgetIncomesForm incomes={incomes} months={summary.months} onChange={saveIncomes} />
              ) : (
                <CollapsibleSection title={t("collapsible.budget.incomes")} subtitle={t("collapsible.budget.incomesSub")} sectionId="incomes">
                  <BudgetIncomesForm incomes={incomes} months={summary.months} onChange={saveIncomes} />
                </CollapsibleSection>
              )}

              <CollapsibleSection title={t("collapsible.budget.categories")} subtitle={t("collapsible.budget.categoriesSub")} sectionId="forecast">
                <div className="space-y-4">
                  <BudgetConfig tripData={tripData} />
                  <BudgetForecast
                    totalBudget={totalBudget}
                    categories={categories}
                    onUpdateCategory={handleUpdateCategory}
                    onAiAdjust={handleAiAdjust}
                    isLoading={isGenerating}
                  />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t("collapsible.budget.payments")} subtitle={t("collapsible.budget.paymentsSub", { count: expenses.length })} sectionId="tracker">
                <div className="space-y-4">
                  <AddExpenseForm onAdd={handleAddExpense} />
                  <ExpenseTracker categories={categories} expenses={expenses} onRemoveExpense={handleRemoveExpense} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t("collapsible.budget.simulator")} subtitle={t("collapsible.budget.simulatorSub")} sectionId="simulator">
                <BudgetSimulator lines={lines} days={days} budget={userBudget} onApply={applySimulation} />
              </CollapsibleSection>

              <CollapsibleSection title={t("collapsible.budget.charts")} subtitle={t("collapsible.budget.chartsSub")} sectionId="charts">
                <div ref={chartRef}>
                  <Suspense fallback={<div className="h-64 w-full rounded-2xl bg-muted animate-pulse" />}>
                    <BudgetCharts categories={categories} days={days} totalBudget={totalBudget} expenses={expenses} />
                  </Suspense>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t("collapsible.budget.analysis")} subtitle={t("collapsible.budget.analysisSub")} sectionId="analysis">
                <BudgetAiResult
                  totalBudget={totalBudget}
                  days={days}
                  destination={destination}
                  onTotalBudgetChange={handleUpdateTotalBudget}
                  insights={insights.data}
                  insightsLoading={insights.isFetching}
                  onApplyScenario={applyScenario}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title={t("collapsible.budget.alerts")}
                subtitle={t("collapsible.budget.alertsSub")}
              >
                <BudgetAlerts categories={categories} destination={destination} deals={insights.data?.deals} loading={insights.isFetching} />
              </CollapsibleSection>

              <CollapsibleSection
                title={t("collapsible.budget.tips")}
                subtitle={t("collapsible.budget.tipsSub")}
                sectionId="tips"
              >
                <BudgetSavingTips
                  destination={destination}
                  tips={insights.data?.tips}
                  loading={insights.isFetching}
                  failed={insights.isError}
                  onRefresh={insights.refresh}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title={t("collapsible.budget.currency")}
                subtitle={t("collapsible.budget.currencySub")}
              >
                <CurrencyConverter destination={destination} />
              </CollapsibleSection>






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
      </main>

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

      <BudgetConfirmDialog
        open={!!pending}
        onOpenChange={(v) => { if (!v) setPending(null); }}
        title={pending?.title || ""}
        description={pending?.description || ""}
        changes={pending ? changedLines(lines, pending.next.map((c) => ({ key: c.key, planned: c.planned, spent: c.spent }))) : []}
        confirmLabel={pending?.confirmLabel || ""}
        onConfirm={() => {
          if (!pending) return;
          setCategories(pending.next);
          pending.onDone?.();
          setPending(null);
        }}
      />
      <QuickJump />
    </div>
  );
};

export default GuideBudgetPage;
