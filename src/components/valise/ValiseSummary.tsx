import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface ValiseSummaryProps {
  totalItems: number;
  checkedItems: number;
  categoriesCount: number;
}

const ValiseSummary = ({ totalItems, checkedItems, categoriesCount }: ValiseSummaryProps) => {
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="glass-card rounded-2xl p-6 text-center"
      >
        <h3 className="text-lg font-bold text-foreground mb-3">Résumé de ta valise</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Objets", value: totalItems },
            { label: "Sélectionnés", value: checkedItems },
            { label: "Catégories", value: categoriesCount },
            { label: "Complétude", value: `${pct}%` },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-muted/50">
              <p className="text-xl font-bold gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="text-center pb-8">
        <Link
          to="/#create"
          className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </Link>
      </div>
    </>
  );
};

export default ValiseSummary;
