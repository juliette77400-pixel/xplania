import { motion } from "framer-motion";
import type { TravelFormData } from "@/types/travel";

interface VoyageAnalysisProps {
  tripData: TravelFormData | null;
  destination: string;
  days: number;
}

const VoyageAnalysis = ({ tripData, destination, days }: VoyageAnalysisProps) => {
  const items = [
    { label: "Destination", value: destination },
    { label: "Durée", value: `${days} jours` },
    { label: "Style", value: tripData?.travelerType || "Explorateur" },
    { label: "Activités", value: tripData?.objectives?.slice(0, 3).join(", ") || "—" },
    { label: "Transport", value: tripData?.localTransport?.join(", ") || "—" },
    { label: "Hébergement", value: tripData?.accommodationType || "Standard" },
    { label: "Type de bagage", value: tripData?.baggageTypes?.join(", ") || "Standard" },
    { label: "Immersion", value: tripData?.culturalImmersion || "Modérée" },
    { label: "Contraintes", value: tripData?.constraints?.length ? tripData.constraints.join(", ") : "Aucune" },
    { label: "Sensibilité éco", value: tripData?.environmentalSensitivity || "Modérée" },
    { label: "Alimentation", value: tripData?.dietaryPreferences?.length ? tripData.dietaryPreferences.join(", ") : "Aucune" },
    { label: "Mobilité", value: tripData?.mobilityDetails || "Aucune restriction" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
        Analyse IA de ton voyage
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
