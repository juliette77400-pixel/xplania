import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useTravelContext } from "@/contexts/TravelContext";
import { toast } from "sonner";

import BudgetHero from "@/components/budget/BudgetHero";
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
  const { tripData } = useTravelContext();
  const destination = tripData?.destination || "Paris";
  const days = tripData?.duration ? parseInt(tripData.duration) || 5 : 5;
  const userBudget = tripData?.totalBudget || 820;

  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [categories, setCategories] = useState<BudgetCategory[]>(defaultCategories);
  const [showModify, setShowModify] = useState(false);

  const totalBudget = categories.reduce((s, c) => s + c.planned, 0) || userBudget;

  const runGeneration = useCallback(async () => {
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
    // Slightly randomize AI suggestions
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
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/#create" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">💰 Budget Intelligent</h1>
              <p className="text-xs text-muted-foreground">Propulsé par IA Xplania</p>
            </div>
          </div>
          {hasGenerated && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-button text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Regénérer le budget
            </motion.button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-5xl">
        {/* Hero */}
        <BudgetHero onGenerate={runGeneration} isGenerating={isGenerating} hasGenerated={hasGenerated} />

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
              {/* Config */}
              <BudgetConfig tripData={tripData} />

              {/* AI Result */}
              <BudgetAiResult
                totalBudget={totalBudget}
                days={days}
                destination={destination}
                onModify={() => setShowModify(!showModify)}
              />

              {/* Forecast */}
              <BudgetForecast
                totalBudget={totalBudget}
                categories={categories}
                onUpdateCategory={handleUpdateCategory}
                onAiAdjust={handleAiAdjust}
                isLoading={isGenerating}
              />

              {/* Expense Tracker Table */}
              <ExpenseTracker categories={categories} />

              {/* Charts */}
              <BudgetCharts categories={categories} days={days} totalBudget={totalBudget} />

              {/* Alerts & Tips */}
              <BudgetAlerts categories={categories} destination={destination} />

              {/* Saving Tips */}
              <BudgetTips />

              {/* Add Expense Form */}
              <AddExpenseForm onAdd={handleAddExpense} />

              {/* Back */}
              <div className="text-center pb-8">
                <Link
                  to="/#create"
                  className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour au dashboard
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuideBudgetPage;
