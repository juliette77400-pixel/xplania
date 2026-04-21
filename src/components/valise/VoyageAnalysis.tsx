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
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
        {t("valise.voyageTitle")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="p-3 rounded-xl bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
            <p className="text-sm font-medium text-foreground mt-1 truncate">{item.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default VoyageAnalysis;
