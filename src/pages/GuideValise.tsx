import { useState, useCallback } from "react";
import { useTravelContext } from "@/contexts/TravelContext";
import ValiseHeader from "@/components/valise/ValiseHeader";
import StepProgressBar from "@/components/valise/StepProgressBar";
import ValiseHero from "@/components/valise/ValiseHero";
import GenerationAnimation, { STEPS } from "@/components/valise/GenerationAnimation";
import VoyageAnalysis from "@/components/valise/VoyageAnalysis";
import WeatherSection from "@/components/valise/WeatherSection";
import LuggageModes, { type LuggageMode } from "@/components/valise/LuggageModes";
import ChecklistSection, { type ChecklistItem } from "@/components/valise/ChecklistSection";
import ActivityItems from "@/components/valise/ActivityItems";
import CulturalTips from "@/components/valise/CulturalTips";
import OutfitRecommendations from "@/components/valise/OutfitRecommendations";
import ActionButtons from "@/components/valise/ActionButtons";
import ValiseSummary from "@/components/valise/ValiseSummary";
import { toast } from "sonner";

// ── Default categories ──
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
  ],
  "Technologie": [
    { name: "Chargeurs & câbles", description: "Téléphone + appareils", checked: true },
    { name: "Batterie externe", description: "10000mAh minimum", checked: true },
    { name: "Adaptateur universel", description: "Pour la destination", checked: true },
    { name: "Écouteurs / AirPods", description: "Pour les trajets", checked: true },
  ],
  "Documents importants": [
    { name: "Passeport", description: "Vérifier la validité (6 mois+)", checked: true },
    { name: "Carte d'identité", description: "Toujours utile", checked: true },
    { name: "Assurances voyage", description: "Copies numériques + papier", checked: false },
    { name: "Billets / réservations", description: "Imprimés + numériques", checked: true },
  ],
  "Santé & Pharmacie": [
    { name: "Mini trousse à pharmacie", description: "Médicaments de base", checked: true },
    { name: "Crème solaire SPF 30+", description: "Protection solaire", checked: true },
    { name: "Anti-moustiques", description: "Selon la destination", checked: false },
    { name: "Gel hydroalcoolique", description: "Format voyage", checked: true },
  ],
  "Hygiène & Soin": [
    { name: "Produits d'hygiène", description: "Format voyage (<100ml)", checked: true },
    { name: "Brosse à dents", description: "+ dentifrice mini", checked: true },
    { name: "Déodorant", description: "Format voyage", checked: true },
  ],
  "Sécurité": [
    { name: "Cadenas TSA", description: "Pour la valise", checked: false },
    { name: "Pochette anti-RFID", description: "Protection cartes bancaires", checked: false },
  ],
};

const modeExtras: Record<LuggageMode, Record<string, ChecklistItem[]>> = {
  minimaliste: {},
  confort: {
    "Confort supplémentaire": [
      { name: "Oreiller de voyage", description: "Mémoire de forme", checked: true },
      { name: "Masque de sommeil", description: "Qualité soie", checked: true },
      { name: "Bouchons d'oreilles", description: "Anti-bruit", checked: true },
    ],
  },
  stylée: {
    "Style & Apparence": [
      { name: "Tenues coordonnées (×3)", description: "Looks complets", checked: true },
      { name: "Chaussures élégantes", description: "Polyvalentes", checked: true },
      { name: "Trousse maquillage", description: "Essentiels beauté", checked: false },
    ],
  },
  aventure: {
    "Équipement aventure": [
      { name: "Couteau suisse", description: "Multi-usage (en soute)", checked: true },
      { name: "Lampe frontale", description: "Rechargeable USB", checked: true },
      { name: "Filtre à eau portable", description: "Indispensable trek", checked: false },
    ],
  },
  business: {
    "Business": [
      { name: "Costume / tailleur", description: "Dans housse", checked: true },
      { name: "Chaussures formelles", description: "Cirées", checked: true },
      { name: "Ordinateur portable", description: "+ chargeur + souris", checked: true },
      { name: "Cartes de visite", description: "En quantité", checked: true },
    ],
  },
  photo: {
    "Matériel photo / vidéo": [
      { name: "Appareil photo", description: "Boîtier + objectifs", checked: true },
      { name: "Trépied carbone", description: "Léger et stable", checked: true },
      { name: "Batteries (×4)", description: "Chargées", checked: true },
      { name: "Cartes SD (256Go)", description: "×2 minimum", checked: true },
    ],
  },
  randonnée: {
    "Équipement randonnée": [
      { name: "Chaussures de trek", description: "Rodées", checked: true },
      { name: "Sac à dos 30-50L", description: "Avec ceinture ventrale", checked: true },
      { name: "Gourde / Camelbak", description: "2L minimum", checked: true },
      { name: "Poncho pluie", description: "Couvre aussi le sac", checked: true },
    ],
  },
  plage: {
    "Essentiels plage": [
      { name: "Maillots de bain (×2)", description: "Pour alterner", checked: true },
      { name: "Paréo / serviette XL", description: "Multi-usage", checked: true },
      { name: "Tongs / sandales", description: "Résistantes à l'eau", checked: true },
      { name: "Crème solaire SPF 50", description: "Waterproof", checked: true },
      { name: "Sac étanche", description: "Pour téléphone + clés", checked: true },
    ],
  },
  roadtrip: {
    "Essentiels road trip": [
      { name: "Glacière pliable", description: "Pour snacks et boissons", checked: true },
      { name: "Support téléphone", description: "Pour la navigation", checked: true },
      { name: "Câble chargeur voiture", description: "USB-C + Lightning", checked: true },
      { name: "Kit premier secours auto", description: "Obligatoire dans certains pays", checked: true },
    ],
  },
};

function buildCategories(mode: LuggageMode): Record<string, ChecklistItem[]> {
  return { ...baseCategories, ...(modeExtras[mode] || {}) };
}

const GuideValisePage = () => {
  const { tripData, recommendations } = useTravelContext();
  const destination = tripData?.destination || "votre destination";
  const days = tripData?.duration ? parseInt(tripData.duration) || 7 : 7;

  const [luggageMode, setLuggageMode] = useState<LuggageMode>("confort");
  const [categories, setCategories] = useState(() => buildCategories("confort"));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);


  const handleModeChange = (mode: LuggageMode) => {
    setLuggageMode(mode);
    setCategories(buildCategories(mode));
    toast.success(`Mode "${mode}" activé`, { description: "La checklist a été adaptée." });
  };

  const toggleItem = (cat: string, idx: number) => {
    setCategories((prev) => ({
      ...prev,
      [cat]: prev[cat].map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item)),
    }));
  };

  const addItem = (cat: string, name: string) => {
    setCategories((prev) => ({
      ...prev,
      [cat]: [...prev[cat], { name, description: "", checked: false }],
    }));
    toast.success("Objet ajouté ✨");
  };

  const removeItem = (cat: string, idx: number) => {
    setCategories((prev) => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== idx),
    }));
    toast("Objet supprimé");
  };

  const runGeneration = useCallback(async () => {
    setIsGenerating(true);
    setGenerationStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setGenerationStep(i + 1);
      setActiveSection(Math.min(i, 7));
    }
    await new Promise((r) => setTimeout(r, 300));
    setIsGenerating(false);
    setActiveSection(7);
    toast.success("Valise générée ! 🧳", { description: "Checklist personnalisée prête." });
  }, []);

  const handleRegenerate = useCallback(
    async (scope: "all" | "clothes" | "activities") => {
      setIsRegenerating(true);
      toast.loading("Régénération en cours…", { id: "regen" });
      await new Promise((r) => setTimeout(r, 1500));
      setCategories(buildCategories(luggageMode));
      setIsRegenerating(false);
      toast.success(
        scope === "all" ? "Valise régénérée !" : scope === "clothes" ? "Vêtements régénérés !" : "Activités régénérées !",
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

      {/* Step progress */}
      <div className="border-b border-border bg-background/60 backdrop-blur">
        <div className="container mx-auto">
          <StepProgressBar currentStep={activeSection} />
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
        <ValiseHero destination={destination} days={days} onGenerate={runGeneration} isGenerating={isGenerating} />

        <GenerationAnimation isGenerating={isGenerating} currentStep={generationStep} />

        <VoyageAnalysis tripData={tripData} destination={destination} days={days} />

        <WeatherSection destination={destination} />

        <LuggageModes activeMode={luggageMode} onSelect={handleModeChange} />

        <ChecklistSection categories={categories} onToggle={toggleItem} onAdd={addItem} onRemove={removeItem} />

        <ActivityItems />

        <CulturalTips destination={destination} />

        <OutfitRecommendations />

        <ActionButtons onRegenerate={handleRegenerate} isRegenerating={isRegenerating} />

        <ValiseSummary totalItems={totalItems} checkedItems={checkedItems} categoriesCount={Object.keys(categories).length} />
      </div>
    </div>
  );
};

export default GuideValisePage;
