import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface ValiseSummaryProps {
  totalItems: number;
  checkedItems: number;
  categoriesCount: number;
}

const ValiseSummary = ({ totalItems, checkedItems, categoriesCount }: ValiseSummaryProps) => {
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const insights = [
    "Valise optimale pour votre voyage",
    "Tenues adaptées au climat prévu",
    "Respect des codes vestimentaires locaux",
    "Équipement complet pour activités prévues",
  ];

  return (
    <>
      {/* Summary stats + insights (single, non-duplicated block) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-foreground text-center mb-2">
          Résumé de ta valise intelligente
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Analyse complète et optimisation IA de ton bagage
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Objets sélectionnés", value: checkedItems },
            { label: "Catégories", value: categoriesCount },
            { label: "Optimisation météo", value: `${Math.min(pct + 8, 100)}%` },
            { label: "Adaptation culturelle", value: `${Math.min(pct + 5, 100)}%` },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-2xl font-bold gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Insights IA</h4>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
          <p className="text-xs text-primary font-semibold mt-3">Confiance IA : 97%</p>
        </div>
      </motion.div>

      {/* Back link */}
      <div className="text-center pb-8">
        <Link
          to="/#create"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </Link>
      </div>
    </>
  );
};

export default ValiseSummary;
