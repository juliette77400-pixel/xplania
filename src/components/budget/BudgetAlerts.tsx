import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, CheckCircle, Lightbulb, Trees, Utensils, Bus, Heart } from "lucide-react";
import type { BudgetCategory } from "./BudgetForecast";

interface Props {
  categories: BudgetCategory[];
  destination: string;
}

const getAlerts = (categories: BudgetCategory[]) => {
  const alerts: { message: string; type: "warning" | "danger" | "success" }[] = [];
  categories.forEach((cat) => {
    const ratio = cat.spent / cat.planned;
    if (ratio > 1) {
      alerts.push({ message: `Dépassement du budget ${cat.key.toLowerCase()} !`, type: "danger" });
    } else if (ratio > 0.8) {
      alerts.push({ message: `Prix des ${cat.key.toLowerCase()} plus élevés que prévu.`, type: "warning" });
    } else if (ratio < 0.5 && cat.spent > 0) {
      alerts.push({ message: `Tu es en dessous du budget prévu pour ${cat.key.toLowerCase()} !`, type: "success" });
    }
  });
  return alerts;
};

const getDestinationTips = (destination: string) => {
  const d = destination.toLowerCase();
  if (d.includes("paris")) {
    return {
      activities: ["Visite du Jardin du Luxembourg", "Balade sur les quais de Seine", "Montmartre et le Sacré-Cœur"],
      restaurants: ["Le Bouillon Chartier", "Marché des Enfants Rouges", "Boulangeries locales"],
      transport: ["Pass Navigo hebdomadaire", "Vélib' pour courtes distances", "Marcher entre attractions proches"],
      mood: ["Pique-nique au parc", "Free walking tour", "Coucher de soleil Tour Eiffel"],
    };
  }
  if (d.includes("tokyo") || d.includes("japon")) {
    return {
      activities: ["Temples gratuits à Asakusa", "Parc Yoyogi le dimanche", "Observation depuis la mairie de Tokyo"],
      restaurants: ["Konbini (7-Eleven, Lawson)", "Ramen shops locaux", "Marchés de rue"],
      transport: ["Suica / Pasmo card", "JR Pass si tu visites plusieurs villes", "Marcher dans les quartiers"],
      mood: ["Hanami au parc Ueno", "Quartier Shimokitazawa", "Lever de soleil au Mont Takao"],
    };
  }
  return {
    activities: ["Visites de musées gratuits", "Parcs et jardins publics", "Marchés locaux"],
    restaurants: ["Cuisine de rue locale", "Marchés alimentaires", "Restaurants hors zone touristique"],
    transport: ["Transports publics locaux", "Location de vélo", "Marche à pied"],
    mood: ["Coucher de soleil panoramique", "Quartiers authentiques", "Événements culturels gratuits"],
  };
};

const BudgetAlerts = ({ categories, destination }: Props) => {
  const alerts = getAlerts(categories);
  const tips = getDestinationTips(destination);

  const tipSections = [
    { title: "Activités gratuites", icon: Trees, items: tips.activities, color: "text-green-400" },
    { title: "Restaurants économiques", icon: Utensils, items: tips.restaurants, color: "text-orange-400" },
    { title: "Alternatives transport", icon: Bus, items: tips.transport, color: "text-blue-400" },
    { title: "Suggestions Mood", icon: Heart, items: tips.mood, color: "text-pink-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 space-y-6"
    >
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Alertes & Optimisation IA</h2>
        <p className="text-sm text-muted-foreground">L'IA surveille tes dépenses et te propose des solutions</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                alert.type === "danger"
                  ? "bg-destructive/10 border border-destructive/20"
                  : alert.type === "warning"
                  ? "bg-yellow-500/10 border border-yellow-500/20"
                  : "bg-green-500/10 border border-green-500/20"
              }`}
            >
              {alert.type === "danger" ? (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              ) : alert.type === "warning" ? (
                <TrendingDown className="w-4 h-4 text-yellow-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              )}
              <p className="text-sm text-foreground">{alert.message}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Contextual tips */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Conseils pour équilibrer ton budget
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tipSections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <section.icon className={`w-4 h-4 ${section.color}`} />
                <h4 className="text-sm font-bold text-foreground">{section.title}</h4>
              </div>
              <ul className="space-y-1.5">
                {section.items.map((item, j) => (
                  <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BudgetAlerts;
