import { motion } from "framer-motion";
import { Download, Link2, Save, CheckCircle, RefreshCw, Shirt, Compass } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ActionButtonsProps {
  onRegenerate: (scope: "all" | "clothes" | "activities") => void;
  isRegenerating: boolean;
  onExportPdf?: () => void;
  onShareTrip?: () => void;
}

const ActionButtons = ({ onRegenerate, isRegenerating, onExportPdf, onShareTrip }: ActionButtonsProps) => {
  const { t } = useTranslation();

  const handleExport = () => {
    if (onExportPdf) return onExportPdf();
    toast.success(t("valise.toastExport"));
  };

  const handleShare = () => {
    if (onShareTrip) return onShareTrip();
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("valise.toastShareCopied"));
  };

  const handleSaveTemplate = () => {
    toast.success(t("valise.toastTemplateSaved"), { description: t("valise.toastTemplateSavedDesc") });
  };

  const handleValidate = () => {
    toast.success(t("valise.toastValidated"), { description: t("valise.toastValidatedDesc") });
  };

  const handleSync = () => {
    toast.success(t("valise.toastSynced"), { description: t("valise.toastSyncedDesc") });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card rounded-2xl p-6 space-y-4"
    >
      <h3 className="text-base font-bold text-foreground">{t("valise.actionsTitle")}</h3>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("valise.actionsRegenerate")}</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: t("valise.actionAll"), scope: "all" as const, icon: <RefreshCw className="w-4 h-4" /> },
            { label: t("valise.actionClothes"), scope: "clothes" as const, icon: <Shirt className="w-4 h-4" /> },
            { label: t("valise.actionActivities"), scope: "activities" as const, icon: <Compass className="w-4 h-4" /> },
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

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("valise.actionsTools")}</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: t("valise.actionExport"), icon: <Download className="w-4 h-4" />, action: handleExport },
            { label: t("valise.actionShare"), icon: <Link2 className="w-4 h-4" />, action: handleShare },
            { label: t("valise.actionTemplate"), icon: <Save className="w-4 h-4" />, action: handleSaveTemplate },
            { label: t("valise.actionSync"), icon: <RefreshCw className="w-4 h-4" />, action: handleSync },
            { label: t("valise.actionValidate"), icon: <CheckCircle className="w-4 h-4" />, action: handleValidate },
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
