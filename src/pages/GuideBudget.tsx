import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
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
import BudgetTips from "@/components/budget/BudgetTips";
import AddExpenseForm, { type Expense } from "@/components/budget/AddExpenseForm";

const GuideBudgetPage = () => {
  useHydrateActiveTrip();
  const { tripData } = useTravelStore();
  const destination = tripData?.destination || "Paris";
  const days = tripData?.duration ? parseInt(tripData.duration) || 5 : 5;
  const userBudget = tripData?.totalBudget || 820;

  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [categories, setCategories] = useState<BudgetCategory[]>(defaultCategories);
  const [showModify, setShowModify] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { reached, consume } = useQuota("budget");

  const totalBudget = categories.reduce((s, c) => s + c.planned, 0) || userBudget;

  const runGeneration = useCallback(async () => {
    if (reached) { setShowUpgrade(true); return; }
    consume();
    setIsGenerating(true);
    setGenStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setGenStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 500));
    setIsGenerating(false);
    setHasGenerated(true);
    toast.success("Budget prévisionnel généré ! 💰");
  }, []);

  const handleRegenerate = useCallback(async () => {
    toast.loading("Xplania recalcule votre budget…", { id: "regen" });
    setIsGenerating(true);
    setGenStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setGenStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 400));
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        aiSuggested: Math.round(c.aiSuggested * (0.9 + Math.random() * 0.2)),
      }))
    );
    setIsGenerating(false);
    toast.success("Budget recalculé !", { id: "regen" });
  }, []);

  const handleAiAdjust = (idx: number) => {
    setCategories((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, planned: c.aiSuggested } : c))
    );
    toast.success(`${categories[idx].key} ajusté par l'IA`);
  };

  const handleUpdateCategory = (idx: number, updates: Partial<BudgetCategory>) => {
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, ...updates } : c)));
  };

  const handleAddExpense = (expense: Expense) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.key === expense.category ? { ...c, spent: c.spent + expense.amount } : c
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <QuotaBanner tool="budget" toolLabel="Budget" />
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} toolName="Budget" />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* Hero */}
        <BudgetHero onGenerate={runGeneration} isGenerating={isGenerating} hasGenerated={hasGenerated} />

        {/* Trip summary dashboard — visible BEFORE generation */}
        {!hasGenerated && !isGenerating && (
          <TripSummaryDashboard tripData={tripData} />
        )}

        {/* Generation animation */}
        <AnimatePresence>
          {isGenerating && <BudgetGenerationAnim isGenerating={isGenerating} currentStep={genStep} />}
        </AnimatePresence>

        {/* Content after generation */}
        <AnimatePresence>
          {hasGenerated && !isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 pb-12"
            >
              {/* Regenerate button */}
              <div className="flex justify-end">
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
                  Regénérer le budget
                </motion.button>
              </div>

              <BudgetConfig tripData={tripData} />
              <BudgetAiResult
                totalBudget={totalBudget}
                days={days}
                destination={destination}
                onModify={() => setShowModify(!showModify)}
              />
              <BudgetForecast
                totalBudget={totalBudget}
                categories={categories}
                onUpdateCategory={handleUpdateCategory}
                onAiAdjust={handleAiAdjust}
                isLoading={isGenerating}
              />
              <ExpenseTracker categories={categories} />
              <BudgetCharts categories={categories} days={days} totalBudget={totalBudget} />
              <BudgetAlerts categories={categories} destination={destination} />
              <BudgetTips />
              <AddExpenseForm onAdd={handleAddExpense} />

              {/* CTA */}
              <div className="flex justify-center">
                <Link
                  to="/guide-visa"
                  className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  Continuer vers Visa & Préparatifs →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <QuickJump />
    </div>
  );
};

export default GuideBudgetPage;
