import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Wallet, TrendingUp, Utensils, Home, Ticket,
  ShoppingBag, AlertTriangle, Lightbulb, PiggyBank, Bus, ChevronDown
} from "lucide-react";
import { useTravelContext } from "@/contexts/TravelContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

const budgetCategories = [
  { key: "Hébergement", icon: Home, color: "text-blue-400", defaultPct: 35 },
  { key: "Transports locaux", icon: Bus, color: "text-green-400", defaultPct: 12 },
  { key: "Activités", icon: Ticket, color: "text-purple-400", defaultPct: 22 },
  { key: "Nourriture", icon: Utensils, color: "text-orange-400", defaultPct: 18 },
  { key: "Shopping", icon: ShoppingBag, color: "text-pink-400", defaultPct: 8 },
  { key: "Extras & Imprévus", icon: AlertTriangle, color: "text-yellow-400", defaultPct: 5 },
];

const savingTips = [
  { title: "Mange local", desc: "Mange local pour réduire les coûts et découvrir la vraie cuisine de ta destination.", emoji: "🍜" },
  { title: "Transports publics", desc: "Utilise les transports publics plutôt que les taxis pour économiser jusqu'à 70%.", emoji: "🚌" },
  { title: "Musées gratuits", desc: "Visite les musées gratuits le lundi ou profite des jours d'entrée gratuite.", emoji: "🏛️" },
  { title: "Petit-déjeuner inclus", desc: "Choisis un hébergement avec petit-déjeuner inclus pour économiser sur les repas.", emoji: "🥐" },
  { title: "Pass touristique", desc: "Achète un pass touristique si tu comptes visiter plusieurs attractions payantes.", emoji: "🎫" },
  { title: "Free walking tours", desc: "Participe aux visites guidées gratuites (à pourboire) pour explorer sans te ruiner.", emoji: "🚶" },
];

const GuideBudgetPage = () => {
  const { tripData, recommendations } = useTravelContext();
  const destination = tripData?.destination || "votre destination";
  const days = tripData?.duration ? parseInt(tripData.duration) || 7 : 7;
  const totalBudget = tripData?.totalBudget || 1500;
  const perDay = Math.round(totalBudget / days);

  // Build breakdown from AI recs or defaults
  const breakdown = recommendations?.budgetBreakdown?.length
    ? recommendations.budgetBreakdown.map((b) => ({
        category: String(typeof b.category === "object" ? Object.values(b.category)[0] : b.category),
        amount: typeof b.amount === "number" ? b.amount : 0,
        tip: String(typeof b.tip === "object" ? Object.values(b.tip)[0] : b.tip || ""),
      }))
    : budgetCategories.map((c) => ({
        category: c.key,
        amount: Math.round(totalBudget * c.defaultPct / 100),
        tip: "",
      }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/#create" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">💰 Budget Intelligent</h1>
            <p className="text-xs text-muted-foreground">Propulsé par IA Xplania</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-3xl space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="gradient-text">Budget Intelligent</span>
          </h2>
          <p className="text-muted-foreground">
            Planifie, suis et optimise tes dépenses pour <span className="text-foreground font-semibold">{destination}</span>
          </p>
        </motion.div>

        {/* Config IA summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Configuration IA du Budget</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Destination", value: destination },
              { label: "Durée", value: `${days} jours` },
              { label: "Budget total", value: `${totalBudget} €` },
              { label: "Par jour", value: `${perDay} €` },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-bold text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>
          {tripData?.budgetDetails && (
            <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">📝 Tes contraintes :</p>
              <p className="text-sm text-foreground">{tripData.budgetDetails}</p>
            </div>
          )}
        </motion.div>

        {/* Budget Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Budget Prévisionnel</h3>
              <p className="text-xs text-muted-foreground">Répartition intelligente par catégorie</p>
            </div>
          </div>

          <div className="space-y-4">
            {breakdown.map((item, i) => {
              const catInfo = budgetCategories.find(c => c.key.toLowerCase().includes(item.category.toLowerCase())) || budgetCategories[5];
              const Icon = catInfo.icon;
              const pct = totalBudget > 0 ? Math.round((item.amount / totalBudget) * 100) : 0;

              return (
                <div key={i} className="p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${catInfo.color}`} />
                      <span className="text-sm font-semibold text-foreground">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground">{item.amount} €</span>
                      <span className="text-xs text-muted-foreground ml-2">({pct}%)</span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                  {item.tip && <p className="text-xs text-primary mt-2">💡 {item.tip}</p>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Savings Tips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Astuces Économies</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savingTips.map((tip, i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tip.emoji}</span>
                  <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Back button */}
        <div className="text-center pb-8">
          <Link
            to="/#create"
            className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuideBudgetPage;
