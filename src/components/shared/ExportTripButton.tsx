// ✨ NEW (Tâche 3) — Bouton export PDF complet du voyage
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportTripAllInOnePDF } from "@/lib/trip-export-all";
import { toast } from "sonner";

export default function ExportTripButton({ tripId, variant = "outline", size = "sm" }: {
  tripId: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "icon";
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportTripAllInOnePDF(tripId);
      toast.success(t("tripExport.success", "PDF généré"));
    } catch (e: any) {
      toast.error(e?.message || t("tripExport.error", "Échec de l'export"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading} variant={variant} size={size}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      <span className="ml-1.5">{t("tripExport.button", "Export PDF complet")}</span>
    </Button>
  );
}
