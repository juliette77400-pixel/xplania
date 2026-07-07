import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { TravelFormData } from "@/types/travel";

interface VoyageAnalysisProps {
  tripData: TravelFormData | null;
  destination: string;
  days: number;
}

const VoyageAnalysis = ({ tripData, destination, days }: VoyageAnalysisProps) => {
  const { t } = useTranslation();
  const items = [
    { label: t("valise.voyageDestination"), value: destination },
    { label: t("valise.voyageDuration"), value: t("valise.heroDays", { count: days }) },
    { label: t("valise.voyageStyle"), value: tripData?.travelerType || t("valise.voyageDefaultStyle") },
    { label: t("valise.voyageActivities"), value: tripData?.objectives?.slice(0, 3).join(", ") || "—" },
    { label: t("valise.voyageTransport"), value: tripData?.localTransport?.join(", ") || "—" },
    { label: t("valise.voyageAccommodation"), value: tripData?.accommodationType || t("valise.voyageStandard") },
    { label: t("valise.voyageBaggage"), value: tripData?.baggageTypes?.join(", ") || t("valise.voyageStandard") },
    { label: t("valise.voyageImmersion"), value: tripData?.culturalImmersion || t("valise.voyageModerate") },
    { label: t("valise.voyageConstraints"), value: tripData?.constraints?.length ? tripData.constraints.join(", ") : t("valise.voyageNone") },
    { label: t("valise.voyageEcoSensitivity"), value: tripData?.environmentalSensitivity || t("valise.voyageModerate") },
    { label: t("valise.voyageDiet"), value: tripData?.dietaryPreferences?.length ? tripData.dietaryPreferences.join(", ") : t("valise.voyageNone") },
    { label: t("valise.voyageMobility"), value: tripData?.mobilityDetails || t("valise.voyageNoneRestriction") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6"
    >
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
        {t("valise.voyageTitle")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.slice(0, 4).map((item) => (
          <div key={item.label} className="p-3 rounded-xl bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
            <p className="text-sm font-medium text-foreground mt-1 truncate">{item.value}</p>
          </div>
        ))}
      </div>
      <details className="mt-4 rounded-xl border border-border/60 bg-background/40">
        <summary className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t("valise.voyageMore")}</summary>
        <div className="grid grid-cols-2 gap-3 border-t border-border/60 p-4 sm:grid-cols-4">{items.slice(4).map((item)=><div key={item.label} className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p><p className="mt-1 truncate text-sm font-medium text-foreground">{item.value}</p></div>)}</div>
      </details>
    </motion.div>
  );
};

export default VoyageAnalysis;
