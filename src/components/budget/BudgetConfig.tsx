import { motion } from "framer-motion";
import { Calendar, MapPin, User, Star, Ticket, Bus, Cloud } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

interface BudgetConfigProps {
  tripData: TravelFormData | null;
}

const BudgetConfig = ({ tripData }: BudgetConfigProps) => {
  const destination = tripData?.destination || "Paris";
  const days = tripData?.duration ? parseInt(tripData.duration) || 5 : 5;
  const style = tripData?.activityLevel || "Aventurier";
  const comfort = tripData?.accommodationStanding || "Confortable";
  const activitiesCount = tripData?.objectives?.length || 8;
  const transport = tripData?.localTransport?.[0] || "Métro & Bus";
  // Determine season from departure date
  const season = (() => {
    if (!tripData?.departureDate) return "Basse saison";
    const month = new Date(tripData.departureDate).getMonth();
    if (month >= 5 && month <= 8) return "Haute saison";
    if (month >= 3 && month <= 4 || month >= 9 && month <= 10) return "Moyenne saison";
    return "Basse saison";
  })();

  const items = [
    { label: "Durée du voyage", value: `${days} jours`, icon: Calendar, color: "text-primary" },
    { label: "Destination", value: destination, icon: MapPin, color: "text-pink-400" },
    { label: "Style du voyageur", value: style, icon: User, color: "text-green-400" },
    { label: "Niveau de confort", value: comfort, icon: Star, color: "text-yellow-400" },
    { label: "Activités prévues", value: String(activitiesCount), icon: Ticket, color: "text-purple-400" },
    { label: "Mode de transport", value: transport, icon: Bus, color: "text-blue-400" },
    { label: "Saison", value: season, icon: Cloud, color: "text-orange-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl p-6"
    >
      <h2 className="text-lg font-bold text-foreground mb-1">Configuration IA du Budget</h2>
      <p className="text-sm text-muted-foreground mb-6">
        L'IA analyse tes préférences pour créer un budget personnalisé
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>

      {tripData?.budgetDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20"
        >
          <p className="text-xs text-muted-foreground">📝 Tes contraintes :</p>
          <p className="text-sm text-foreground">{tripData.budgetDetails}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BudgetConfig;
