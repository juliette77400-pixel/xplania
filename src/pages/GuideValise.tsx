import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Luggage, CheckCircle, CloudSun, Globe,
  Shirt, Glasses, Compass, Camera, Briefcase, Car, Mountain, Umbrella
} from "lucide-react";
import { useTravelContext } from "@/contexts/TravelContext";

interface ChecklistItem {
  name: string;
  description: string;
  checked: boolean;
}

const defaultCategories: Record<string, ChecklistItem[]> = {
  "Vêtements essentiels": [
    { name: "T-shirts (3-4)", description: "Couleurs neutres, respirants", checked: true },
    { name: "Pull léger", description: "Pour les soirées fraîches", checked: true },
    { name: "Pantalon confortable", description: "Idéal pour marcher", checked: true },
    { name: "Short", description: "Pour les journées chaudes", checked: false },
    { name: "Tenue de soirée", description: "Élégante mais décontractée", checked: false },
    { name: "Veste légère", description: "Adaptée au climat", checked: true },
  ],
  "Accessoires & Protection": [
    { name: "Lunettes de soleil", description: "Protection UV", checked: true },
    { name: "Casquette", description: "Pour les visites en plein jour", checked: true },
    { name: "Écharpe légère", description: "Style et confort", checked: false },
    { name: "Parapluie compact", description: "En cas de pluie", checked: false },
  ],
  "Essentiels de voyage": [
    { name: "Mini trousse à pharmacie", description: "Médicaments de base", checked: true },
    { name: "Produits d'hygiène", description: "Format voyage", checked: true },
    { name: "Crème solaire SPF 30+", description: "Protection solaire", checked: true },
    { name: "Adaptateur universel", description: "Pour la destination", checked: true },
    { name: "Chargeurs & câbles", description: "Téléphone + appareils", checked: true },
    { name: "Batterie externe", description: "10000mAh minimum", checked: true },
    { name: "Passeport & documents", description: "Vérifier la validité", checked: true },
    { name: "Assurances voyage", description: "Copies numériques et papier", checked: false },
  ],
};

const activityItems: Record<string, { icon: React.ReactNode; items: string[] }> = {
  "Randonnée": { icon: <Mountain className="w-4 h-4" />, items: ["Chaussures de randonnée", "Sac à dos étanche", "Gourde réutilisable", "Bâtons de marche"] },
  "Plage": { icon: <Umbrella className="w-4 h-4" />, items: ["Maillot de bain", "Serviette microfibre", "Tongs / sandales"] },
  "Ville": { icon: <Compass className="w-4 h-4" />, items: ["Chaussures de marche confortables", "Sac bandoulière anti-vol", "Bouteille d'eau portable"] },
  "Photo / Création": { icon: <Camera className="w-4 h-4" />, items: ["Appareil photo + objectifs", "Batteries supplémentaires", "Cartes mémoire (64Go+)"] },
  "Business": { icon: <Briefcase className="w-4 h-4" />, items: ["Tenue formelle complète", "Chaussures élégantes", "Ordinateur portable + chargeur"] },
  "Road trip": { icon: <Car className="w-4 h-4" />, items: ["Snacks et boissons", "Kit de premiers secours", "Adaptateurs allume-cigare"] },
};

const GuideValisePage = () => {
  const { tripData, recommendations } = useTravelContext();
  const destination = tripData?.destination || "votre destination";
  const days = tripData?.duration ? parseInt(tripData.duration) || 7 : 7;

  // Build checklist from AI recs or defaults
  const [categories, setCategories] = useState(() => {
    if (recommendations?.luggage?.length) {
      const aiItems: ChecklistItem[] = recommendations.luggage.map((item) => ({
        name: String(typeof item === "object" ? Object.values(item)[0] : item),
        description: "",
        checked: false,
      }));
      return { "Générés par IA": aiItems, ...defaultCategories };
    }
    return defaultCategories;
  });

  const toggleItem = (category: string, index: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: prev[category].map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const totalItems = Object.values(categories).flat().length;
  const checkedItems = Object.values(categories).flat().filter(i => i.checked).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/#create" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">🧳 Valise Intelligente</h1>
            <p className="text-xs text-muted-foreground">IA Avancée Xplania</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{checkedItems}/{totalItems}</p>
            <p className="text-[10px] text-muted-foreground">sélectionnés</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-3xl space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="gradient-text">L'IA qui prépare ta valise</span>
          </h2>
          <p className="text-muted-foreground">
            Checklist personnalisée pour <span className="text-foreground font-semibold">{destination}</span> · {days} jours
          </p>
        </motion.div>

        {/* Voyage analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Analyse IA de ton voyage</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Destination", value: destination },
              { label: "Durée", value: `${days} jours` },
              { label: "Style", value: tripData?.travelerType || "Explorateur" },
              { label: "Transport", value: tripData?.localTransport?.join(", ") || "—" },
              { label: "Type de bagage", value: tripData?.baggageTypes?.join(", ") || "Standard" },
              { label: "Contraintes", value: tripData?.constraints?.length ? tripData.constraints.join(", ") : "Aucune" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-muted/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weather info */}
        {recommendations?.weather && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <CloudSun className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Météo prévue</h3>
            </div>
            <p className="text-sm text-muted-foreground">{String(typeof recommendations.weather.current === "object" ? Object.values(recommendations.weather.current)[0] : recommendations.weather.current)}</p>
            <p className="text-sm text-primary font-medium mt-1">{String(typeof recommendations.weather.advice === "object" ? Object.values(recommendations.weather.advice)[0] : recommendations.weather.advice)}</p>
          </motion.div>
        )}

        {/* Checklist */}
        {Object.entries(categories).map(([category, items], catIdx) => (
          <motion.div key={category}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + catIdx * 0.05 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">{category}</h3>
              <span className="text-xs text-muted-foreground">
                {items.filter(i => i.checked).length} / {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleItem(category, i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    item.checked ? "bg-primary/10 border border-primary/20" : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    item.checked ? "bg-primary border-primary" : "border-muted-foreground/30"
                  }`}>
                    {item.checked && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${item.checked ? "text-foreground" : "text-foreground/80"}`}>{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Activity-specific items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
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

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6 text-center"
        >
          <h3 className="text-lg font-bold text-foreground mb-3">Résumé de ta valise</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Objets", value: totalItems },
              { label: "Sélectionnés", value: checkedItems },
              { label: "Catégories", value: Object.keys(categories).length },
              { label: "Complétude", value: `${totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0}%` },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-muted/50">
                <p className="text-xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Back */}
        <div className="text-center pb-8">
          <Link
            to="/#create"
            className="gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuideValisePage;
