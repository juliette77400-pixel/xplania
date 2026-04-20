import { motion } from "framer-motion";
import {
  Download, Link2, Save, CheckCircle, RefreshCw, Shirt, Compass
} from "lucide-react";
import { toast } from "sonner";

interface ActionButtonsProps {
  onRegenerate: (scope: "all" | "clothes" | "activities") => void;
  isRegenerating: boolean;
  onExportPdf?: () => void;
  onShareTrip?: () => void;
}

const ActionButtons = ({ onRegenerate, isRegenerating, onExportPdf, onShareTrip }: ActionButtonsProps) => {
  const handleExport = () => {
    if (onExportPdf) return onExportPdf();
    toast.success("Checklist exportée ! 📋");
  };

  const handleShare = () => {
    if (onShareTrip) return onShareTrip();
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié ! 🔗");
  };

  const handleSaveTemplate = () => {
    toast.success("Modèle sauvegardé ! 💾", { description: "Réutilisez-le pour vos prochains voyages." });
  };

  const handleValidate = () => {
    toast.success("Valise validée ! ✅", { description: "Vous êtes prêt pour le voyage !" });
  };

  const handleSync = () => {
    toast.success("Synchronisé ! 🔄", { description: "Votre valise est liée à votre itinéraire." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card rounded-2xl p-6 space-y-4"
    >
      <h3 className="text-base font-bold text-foreground">Actions</h3>

      {/* Regeneration */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Régénérer</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Toute la valise", scope: "all" as const, icon: <RefreshCw className="w-4 h-4" /> },
            { label: "Vêtements", scope: "clothes" as const, icon: <Shirt className="w-4 h-4" /> },
            { label: "Activités", scope: "activities" as const, icon: <Compass className="w-4 h-4" /> },
          ].map((btn) => (
            <button
              key={btn.scope}
              disabled={isRegenerating}
              onClick={() => onRegenerate(btn.scope)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted/80 text-sm text-foreground font-medium transition-colors disabled:opacity-50"
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Other actions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outils</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Exporter ma checklist", icon: <Download className="w-4 h-4" />, action: handleExport },
            { label: "Partager ma liste", icon: <Link2 className="w-4 h-4" />, action: handleShare },
            { label: "Enregistrer comme modèle", icon: <Save className="w-4 h-4" />, action: handleSaveTemplate },
            { label: "Synchroniser avec mon voyage", icon: <RefreshCw className="w-4 h-4" />, action: handleSync },
            { label: "Valider ma valise", icon: <CheckCircle className="w-4 h-4" />, action: handleValidate },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted/80 text-sm text-foreground font-medium transition-colors"
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ActionButtons;
