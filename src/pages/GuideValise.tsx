import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTravelContext } from "@/contexts/TravelContext";
import ValiseHeader from "@/components/valise/ValiseHeader";
import GenerationAnimation, { STEPS } from "@/components/valise/GenerationAnimation";
import VoyageAnalysis from "@/components/valise/VoyageAnalysis";
import WeatherSection, { type WeatherInfo } from "@/components/valise/WeatherSection";
import LuggageModes, { type LuggageMode } from "@/components/valise/LuggageModes";
import ChecklistSection, { type ChecklistItem } from "@/components/valise/ChecklistSection";
import ActivityItems from "@/components/valise/ActivityItems";
import CulturalTips from "@/components/valise/CulturalTips";
import ActionButtons from "@/components/valise/ActionButtons";
import ValiseSummary from "@/components/valise/ValiseSummary";
import { toast } from "sonner";

// ── Default categories by luggage mode ──
const baseCategories: Record<string, ChecklistItem[]> = {
  "Vêtements essentiels": [
    { name: "T-shirts (3-4)", description: "Couleurs neutres, respirants", checked: true },
    { name: "Pull léger", description: "Pour les soirées fraîches", checked: true },
    { name: "Pantalon confortable", description: "Idéal pour marcher", checked: true },
    { name: "Short", description: "Pour les journées chaudes", checked: false },
    { name: "Tenue de soirée", description: "Élégante mais décontractée", checked: false },
    { name: "Veste légère", description: "Adaptée au climat", checked: true },
    { name: "Sous-vêtements (×5)", description: "Prévoir lavage", checked: true },
    { name: "Pyjama", description: "Confortable", checked: false },
  ],
  "Accessoires & Protection": [
    { name: "Lunettes de soleil", description: "Protection UV", checked: true },
    { name: "Casquette / chapeau", description: "Pour les visites en plein jour", checked: true },
    { name: "Écharpe légère", description: "Style et confort", checked: false },
    { name: "Parapluie compact", description: "En cas de pluie", checked: false },
    { name: "Ceinture", description: "Accessoire polyvalent", checked: false },
  ],
  "Technologie": [
    { name: "Chargeurs & câbles", description: "Téléphone + appareils", checked: true },
    { name: "Batterie externe", description: "10000mAh minimum", checked: true },
    { name: "Adaptateur universel", description: "Pour la destination", checked: true },
    { name: "Écouteurs / AirPods", description: "Pour les trajets", checked: true },
    { name: "E-reader / tablette", description: "Pour les temps calmes", checked: false },
  ],
  "Documents importants": [
    { name: "Passeport", description: "Vérifier la validité (6 mois+)", checked: true },
    { name: "Carte d'identité", description: "Toujours utile", checked: true },
    { name: "Assurances voyage", description: "Copies numériques + papier", checked: false },
    { name: "Billets / réservations", description: "Imprimés + numériques", checked: true },
    { name: "Permis de conduire international", description: "Si location de véhicule", checked: false },
    { name: "Photocopies documents", description: "Séparées des originaux", checked: false },
  ],
  "Santé & Pharmacie": [
    { name: "Mini trousse à pharmacie", description: "Médicaments de base", checked: true },
    { name: "Crème solaire SPF 30+", description: "Protection solaire", checked: true },
    { name: "Anti-moustiques", description: "Selon la destination", checked: false },
    { name: "Pansements", description: "Pour les ampoules", checked: true },
    { name: "Médicaments personnels", description: "Ordonnance en anglais", checked: false },
    { name: "Gel hydroalcoolique", description: "Format voyage", checked: true },
  ],
  "Hygiène & Soin": [
    { name: "Produits d'hygiène", description: "Format voyage (<100ml)", checked: true },
    { name: "Brosse à dents", description: "+ dentifrice mini", checked: true },
    { name: "Déodorant", description: "Format voyage", checked: true },
    { name: "Shampoing solide", description: "Économique et écologique", checked: false },
    { name: "Serviette microfibre", description: "Sèche vite, compacte", checked: false },
  ],
  "Sécurité": [
    { name: "Cadenas TSA", description: "Pour la valise", checked: false },
    { name: "Pochette anti-RFID", description: "Protection cartes bancaires", checked: false },
    { name: "Ceinture porte-monnaie", description: "Cachée sous les vêtements", checked: false },
    { name: "Sifflet d'urgence", description: "Compact, utile en randonnée", checked: false },
  ],
};

const modeOverrides: Record<LuggageMode, Partial<Record<string, ChecklistItem[]>>> = {
  minimaliste: {},
  confort: {
    "Confort supplémentaire": [
      { name: "Oreiller de voyage", description: "Mémoire de forme", checked: true },
      { name: "Masque de sommeil", description: "Qualité soie", checked: true },
      { name: "Bouchons d'oreilles", description: "Anti-bruit", checked: true },
      { name: "Pantoufles de voyage", description: "Confort hôtel", checked: false },
    ],
  },
  stylée: {
    "Style & Apparence": [
      { name: "Tenues coordonnées (×3)", description: "Looks complets", checked: true },
      { name: "Accessoires de mode", description: "Bijoux, montres", checked: false },
      { name: "Chaussures élégantes", description: "Polyvalentes", checked: true },
      { name: "Trousse maquillage", description: "Essentiels beauté", checked: false },
    ],
  },
  aventure: {
    "Équipement aventure": [
      { name: "Couteau suisse", description: "Multi-usage (en soute)", checked: true },
      { name: "Corde paracorde", description: "10m minimum", checked: false },
      { name: "Lampe frontale", description: "Rechargeable USB", checked: true },
      { name: "Kit feu", description: "Allumettes étanches", checked: false },
      { name: "Filtre à eau portable", description: "Indispensable trek", checked: false },
    ],
  },
  business: {
    "Business": [
      { name: "Costume / tailleur", description: "Repassé, dans housse", checked: true },
      { name: "Chaussures formelles", description: "Cirées", checked: true },
      { name: "Cravate / foulard", description: "Accessoire pro", checked: false },
      { name: "Ordinateur portable", description: "+ chargeur + souris", checked: true },
      { name: "Cartes de visite", description: "En quantité suffisante", checked: true },
      { name: "Pochette documents A4", description: "Contrats, présentations", checked: true },
    ],
  },
  photo: {
    "Matériel photo / vidéo": [
      { name: "Appareil photo", description: "Boîtier + objectifs", checked: true },
      { name: "Trépied carbone", description: "Léger et stable", checked: true },
      { name: "Batteries (×4)", description: "Chargées", checked: true },
      { name: "Cartes SD (256Go)", description: "×2 minimum", checked: true },
      { name: "Filtres ND + polarisant", description: "Pour les paysages", checked: false },
      { name: "Drone", description: "Vérifier la réglementation", checked: false },
      { name: "Housse pluie", description: "Protection matériel", checked: true },
    ],
  },
  randonnée: {
    "Équipement randonnée": [
      { name: "Chaussures de trek", description: "Rodées avant le voyage", checked: true },
      { name: "Sac à dos 30-50L", description: "Avec ceinture ventrale", checked: true },
      { name: "Bâtons de marche", description: "Télescopiques", checked: false },
      { name: "Gourde / Camelbak", description: "2L minimum", checked: true },
      { name: "Vêtements techniques", description: "Respirants, séchage rapide", checked: true },
      { name: "Guêtres", description: "Protection chevilles", checked: false },
      { name: "Poncho pluie", description: "Couvre aussi le sac", checked: true },
    ],
  },
  plage: {
    "Essentiels plage": [
      { name: "Maillots de bain (×2)", description: "Pour alterner", checked: true },
      { name: "Paréo / serviette XL", description: "Multi-usage", checked: true },
      { name: "Tongs / sandales", description: "Résistantes à l'eau", checked: true },
      { name: "Crème solaire SPF 50", description: "Waterproof", checked: true },
      { name: "Lunettes UV catégorie 3+", description: "Anti-reflets", checked: true },
      { name: "Sac étanche", description: "Pour téléphone + clés", checked: true },
      { name: "Chapeau de plage", description: "Large bord", checked: false },
    ],
  },
  roadtrip: {
    "Essentiels road trip": [
      { name: "Glacière pliable", description: "Pour snacks et boissons", checked: true },
      { name: "Couverture de voyage", description: "Pour les nuits en voiture", checked: false },
      { name: "Support téléphone", description: "Pour la navigation", checked: true },
      { name: "Câble chargeur voiture", description: "USB-C + Lightning", checked: true },
      { name: "Kit premier secours auto", description: "Obligatoire dans certains pays", checked: true },
      { name: "Carte routière papier", description: "Backup GPS", checked: false },
      { name: "Oreiller de voyage", description: "Pour le passager", checked: false },
    ],
  },
};

function buildCategories(mode: LuggageMode): Record<string, ChecklistItem[]> {
  const extra = modeOverrides[mode] || {};
  return { ...baseCategories, ...extra };
}

const GuideValisePage = () => {
  const { tripData, recommendations } = useTravelContext();
  const destination = tripData?.destination || "votre destination";
  const days = tripData?.duration ? parseInt(tripData.duration) || 7 : 7;

  const [luggageMode, setLuggageMode] = useState<LuggageMode>("confort");
  const [categories, setCategories] = useState<Record<string, ChecklistItem[]>>(() => buildCategories("confort"));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Weather from recommendations or mock
  const [weather] = useState<WeatherInfo | null>(() => {
    if (recommendations?.weather) {
      return {
        temperature: recommendations.weather.temperature,
        conditions: recommendations.weather.current,
        advice: [recommendations.weather.advice].filter(Boolean) as string[],
      };
    }
    return {
      temperature: "22°C",
      humidity: "65%",
      wind: "15 km/h",
      conditions: "Partiellement nuageux",
      advice: [
        "Prévois un pull léger : nuits fraîches prévues",
        "Prévois un imperméable : risque de pluie en fin de journée",
      ],
    };
  });

  const handleModeChange = (mode: LuggageMode) => {
    setLuggageMode(mode);
    setCategories(buildCategories(mode));
    toast.success(`Mode "${mode}" activé`, { description: "La checklist a été adaptée." });
  };

  const toggleItem = (category: string, index: number) => {
    setCategories((prev) => ({
      ...prev,
      [category]: prev[category].map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const addItem = (category: string, name: string) => {
    setCategories((prev) => ({
      ...prev,
      [category]: [...prev[category], { name, description: "", checked: false }],
    }));
    toast.success("Objet ajouté ✨");
  };

  const removeItem = (category: string, index: number) => {
    setCategories((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
    toast("Objet supprimé", { description: "Vous pouvez le rajouter à tout moment." });
  };

  const runGeneration = useCallback(async () => {
    setIsGenerating(true);
    setGenerationStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setGenerationStep(i + 1);
    }
    await new Promise((r) => setTimeout(r, 300));
    setIsGenerating(false);
    toast.success("Valise générée ! 🧳", { description: "Checklist personnalisée prête." });
  }, []);

  const handleRegenerate = useCallback(
    async (scope: "all" | "clothes" | "activities") => {
      setIsRegenerating(true);
      toast.loading("Régénération en cours…", { id: "regen" });
      await new Promise((r) => setTimeout(r, 1500));
      // Reset the mode categories
      setCategories(buildCategories(luggageMode));
      setIsRegenerating(false);
      toast.success(
        scope === "all"
          ? "Valise régénérée !"
          : scope === "clothes"
          ? "Vêtements régénérés !"
          : "Activités régénérées !",
        { id: "regen" }
      );
    },
    [luggageMode]
  );

  const totalItems = Object.values(categories).flat().length;
  const checkedItems = Object.values(categories).flat().filter((i) => i.checked).length;

  return (
    <div className="min-h-screen bg-background">
      <ValiseHeader checkedItems={checkedItems} totalItems={totalItems} />

      <div className="container mx-auto px-6 py-8 max-w-3xl space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="gradient-text">L'IA qui prépare ta valise</span>
          </h2>
          <p className="text-muted-foreground">
            Checklist personnalisée pour{" "}
            <span className="text-foreground font-semibold">{destination}</span> · {days} jours
          </p>
          {!isGenerating && (
            <button
              onClick={runGeneration}
              className="mt-4 gradient-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              🧠 Générer ma valise
            </button>
          )}
        </motion.div>

        <GenerationAnimation isGenerating={isGenerating} currentStep={generationStep} />

        <VoyageAnalysis tripData={tripData} destination={destination} days={days} />

        <WeatherSection weather={weather} destination={destination} />

        <LuggageModes activeMode={luggageMode} onSelect={handleModeChange} />

        <ChecklistSection
          categories={categories}
          onToggle={toggleItem}
          onAdd={addItem}
          onRemove={removeItem}
        />

        <ActivityItems />

        <CulturalTips destination={destination} />

        <ActionButtons onRegenerate={handleRegenerate} isRegenerating={isRegenerating} />

        <ValiseSummary totalItems={totalItems} checkedItems={checkedItems} categoriesCount={Object.keys(categories).length} />
      </div>
    </div>
  );
};

export default GuideValisePage;
