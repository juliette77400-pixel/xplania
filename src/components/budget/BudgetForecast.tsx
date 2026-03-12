import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Bus, Ticket, Utensils, ShoppingBag, AlertTriangle, Sparkles, ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface BudgetCategory {
  key: string;
  planned: number;
  aiSuggested: number;
  spent: number;
  icon: React.ElementType;
  color: string;
}

const defaultCategories: BudgetCategory[] = [
  { key: "Hébergement", planned: 300, aiSuggested: 280, spent: 150, icon: Home, color: "text-blue-400" },
  { key: "Transports locaux", planned: 80, aiSuggested: 95, spent: 65, icon: Bus, color: "text-green-400" },
  { key: "Activités", planned: 200, aiSuggested: 220, spent: 90, icon: Ticket, color: "text-purple-400" },
  { key: "Nourriture", planned: 150, aiSuggested: 140, spent: 60, icon: Utensils, color: "text-orange-400" },
  { key: "Shopping", planned: 50, aiSuggested: 45, spent: 15, icon: ShoppingBag, color: "text-pink-400" },
  { key: "Extras", planned: 30, aiSuggested: 25, spent: 5, icon: AlertTriangle, color: "text-yellow-400" },
  { key: "Imprévus", planned: 10, aiSuggested: 15, spent: 0, icon: AlertTriangle, color: "text-red-400" },
];

interface Props {
  totalBudget: number;
  categories: BudgetCategory[];
  onUpdateCategory: (index: number, updates: Partial<BudgetCategory>) => void;
  onAiAdjust: (index: number) => void;
  isLoading: boolean;
}

const BudgetForecast = ({ totalBudget, categories, onUpdateCategory, onAiAdjust, isLoading }: Props) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(String(categories[idx].planned));
  };

  const handleSave = (idx: number) => {
    const val = parseInt(editValue) || 0;
    onUpdateCategory(idx, { planned: val });
    setEditingIdx(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Budget Prévisionnel</h2>
          <p className="text-xs text-muted-foreground">Répartition intelligente de ton budget par catégorie</p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const pct = totalBudget > 0 ? Math.round((cat.planned / totalBudget) * 100) : 0;
            const diff = cat.aiSuggested - cat.planned;

            return (
              <motion.div
                key={cat.key}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{cat.key}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Budget prévu</p>
                      {editingIdx === i ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSave(i)}
                          onKeyDown={(e) => e.key === "Enter" && handleSave(i)}
                          className="w-20 bg-muted border border-border rounded px-2 py-0.5 text-sm font-bold text-foreground text-right"
                        />
                      ) : (
                        <button
                          onClick={() => handleEdit(i)}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {cat.planned}€
                          <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Conseillé par IA</p>
                      <p className={`text-sm font-bold ${diff > 0 ? "text-primary" : diff < 0 ? "text-green-400" : "text-foreground"}`}>
                        {cat.aiSuggested}€
                      </p>
                    </div>
                  </div>
                </div>

                <Progress value={pct} className="h-1.5 mb-2" />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{pct}% du budget total</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAiAdjust(i)}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Laisser l'IA ajuster
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export { defaultCategories };
export default BudgetForecast;
