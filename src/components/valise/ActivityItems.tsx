import { motion } from "framer-motion";
import {
  Mountain, Umbrella, Compass, Camera, Briefcase, Car,
  Dumbbell, Utensils
} from "lucide-react";

const activityItems: Record<string, { icon: React.ReactNode; items: string[] }> = {
  "Randonnée": {
    icon: <Mountain className="w-4 h-4" />,
    items: ["Chaussures de randonnée", "Sac à dos étanche", "Gourde réutilisable", "Bâtons de marche", "Lampe frontale", "Couverture de survie"],
  },
  "Plage": {
    icon: <Umbrella className="w-4 h-4" />,
    items: ["Maillot de bain (×2)", "Serviette microfibre", "Tongs / sandales", "Lunettes UV catégorie 3+", "Chapeau de plage", "Sac étanche téléphone"],
  },
  "Ville": {
    icon: <Compass className="w-4 h-4" />,
    items: ["Chaussures de marche confortables", "Sac bandoulière anti-vol", "Bouteille d'eau portable", "Plan / carte hors-ligne", "Batterie externe"],
  },
  "Photo / Création": {
    icon: <Camera className="w-4 h-4" />,
    items: ["Appareil photo + objectifs", "Batteries supplémentaires (×3)", "Cartes mémoire (128Go+)", "Trépied léger", "Filtre ND / polarisant", "Housse pluie objectif"],
  },
  "Business": {
    icon: <Briefcase className="w-4 h-4" />,
    items: ["Tenue formelle complète", "Chaussures élégantes", "Ordinateur portable + chargeur", "Pochette à documents", "Cravate / accessoire formel", "Stylo premium"],
  },
  "Road trip": {
    icon: <Car className="w-4 h-4" />,
    items: ["Snacks et boissons", "Kit de premiers secours", "Adaptateurs allume-cigare", "Couverture de voyage", "Oreiller de voyage", "Câble AUX / Bluetooth"],
  },
  "Sport / Fitness": {
    icon: <Dumbbell className="w-4 h-4" />,
    items: ["Tenue de sport", "Baskets running", "Bandes élastiques", "Gourde sport", "Écouteurs sport"],
  },
  "Gastronomie": {
    icon: <Utensils className="w-4 h-4" />,
    items: ["Carnet de notes", "Médicaments digestion", "Guide culinaire local", "Sac isotherme (pour ramener)"],
  },
};

const ActivityItems = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="glass-card rounded-2xl p-6"
  >
    <h3 className="text-base font-bold text-foreground mb-4">Objets spécifiques par activité</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(activityItems).map(([activity, { icon, items }]) => (
        <div key={activity} className="p-4 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary">{icon}</span>
            <p className="text-sm font-semibold text-foreground">{activity}</p>
          </div>
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </motion.div>
);

export default ActivityItems;
