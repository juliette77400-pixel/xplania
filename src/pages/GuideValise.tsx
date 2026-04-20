import { useState, useCallback, useMemo } from "react";
import { useTravelStore } from "@/stores/useTravelStore";
import ValiseHeader from "@/components/valise/ValiseHeader";
import StepProgressBar from "@/components/valise/StepProgressBar";
import ValiseHero from "@/components/valise/ValiseHero";
import GenerationAnimation, { STEPS } from "@/components/valise/GenerationAnimation";
import VoyageAnalysis from "@/components/valise/VoyageAnalysis";
import WeatherSection from "@/components/valise/WeatherSection";
import LuggageModes, { type LuggageMode } from "@/components/valise/LuggageModes";
import TransportSelector, { type TransportMode } from "@/components/valise/TransportSelector";
import ShareTripDialog from "@/components/valise/ShareTripDialog";
import { exportValisePdf } from "@/lib/valise-export";
import AiTipCard from "@/components/valise/AiTipCard";
import ChecklistSection, { type ChecklistItem } from "@/components/valise/ChecklistSection";
import ActivityItems from "@/components/valise/ActivityItems";
import CulturalTips from "@/components/valise/CulturalTips";
import OutfitRecommendations from "@/components/valise/OutfitRecommendations";
import ActionButtons from "@/components/valise/ActionButtons";
import ValiseSummary from "@/components/valise/ValiseSummary";
import { toast } from "sonner";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import QuotaBanner from "@/components/shared/QuotaBanner";
import UpgradeDialog from "@/components/shared/UpgradeDialog";
import { useQuota } from "@/hooks/useQuota";
import { useHydrateActiveTrip } from "@/hooks/useHydrateActiveTrip";

// ── Categories data ──
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
  urbain: {
    "Essentiels city break 🏙️": [
      { name: "Sneakers confortables", description: "Stylées et marche longue", checked: true },
      { name: "Sac à bandoulière anti-vol", description: "Sécurise tes affaires en ville", checked: true },
      { name: "Veste polyvalente", description: "Jour & soir", checked: true },
      { name: "Carte de transport / app", description: "Métro, bus, vélos", checked: false },
    ],
  },
  luxe: {
    "Essentiels luxe 💎": [
      { name: "Valise rigide premium", description: "Cabine + soute", checked: true },
      { name: "Tenue de soirée", description: "Smoking / robe cocktail", checked: true },
      { name: "Trousse de toilette cuir", description: "Soins haut de gamme", checked: true },
      { name: "Bijoux discrets", description: "Coffre-fort hôtel conseillé", checked: false },
    ],
  },
};

const transportExtras: Record<TransportMode, Record<string, ChecklistItem[]>> = {
  avion: {
    "Spécial Avion ✈️": [
      { name: "Liquides en flacons <100ml", description: "Sac transparent zip", checked: true },
      { name: "Coussin cervical", description: "Pour long-courrier", checked: false },
      { name: "Boules quies / masque", description: "Sommeil en vol", checked: true },
      { name: "Pièce d'identité accessible", description: "Pour contrôles", checked: true },
      { name: "Power bank <100Wh", description: "Obligatoire en cabine", checked: true },
    ],
  },
  train: {
    "Spécial Train 🚆": [
      { name: "Billet imprimé / e-billet", description: "Présenter au contrôleur", checked: true },
      { name: "Snacks & gourde", description: "Voiture-bar souvent chère", checked: false },
      { name: "Livre / podcast", description: "Pour le trajet", checked: false },
    ],
  },
  voiture: {
    "Spécial Voiture 🚗": [
      { name: "Permis & carte grise", description: "Documents obligatoires", checked: true },
      { name: "Gilet jaune & triangle", description: "Obligatoire UE", checked: true },
      { name: "Support téléphone GPS", description: "Navigation mains libres", checked: true },
      { name: "Câble chargeur 12V", description: "USB-C + Lightning", checked: true },
      { name: "Vignette / péage badge", description: "Selon pays traversés", checked: false },
      { name: "Glacière / snacks", description: "Pause sur la route", checked: false },
    ],
  },
  bateau: {
    "Spécial Bateau 🚢": [
      { name: "Anti mal de mer", description: "Cocculine ou Mercalm", checked: true },
      { name: "Coupe-vent imperméable", description: "Vent en mer", checked: true },
      { name: "Chaussures antidérapantes", description: "Ponts mouillés", checked: true },
      { name: "Crème solaire SPF 50", description: "Réverbération de l'eau", checked: true },
      { name: "Sac étanche", description: "Protection téléphone/papiers", checked: false },
    ],
  },
};

function buildCategories(mode: LuggageMode, transport: TransportMode): Record<string, ChecklistItem[]> {
  return { ...baseCategories, ...(modeExtras[mode] || {}), ...(transportExtras[transport] || {}) };
}

function detectSuggestedMode(tripTypes?: string[], objectives?: string[]): LuggageMode | null {
  const all = [...(tripTypes || []), ...(objectives || [])].join(" ").toLowerCase();
  if (all.includes("plage") || all.includes("balnéaire") || all.includes("mer")) return "plage";
  if (all.includes("rando") || all.includes("trek") || all.includes("nature")) return "randonnée";
  if (all.includes("business") || all.includes("professionnel")) return "business";
  if (all.includes("road") || all.includes("voiture")) return "roadtrip";
  if (all.includes("photo") || all.includes("créat")) return "photo";
  if (all.includes("aventure") || all.includes("sport")) return "aventure";
  if (all.includes("luxe") || all.includes("premium")) return "luxe";
  if (all.includes("city") || all.includes("urbain") || all.includes("ville")) return "urbain";
  if (all.includes("confort")) return "confort";
  return null;
}

const GuideValisePage = () => {
  useHydrateActiveTrip();
  const { tripData } = useTravelStore();
  const destination = tripData?.destination || "votre destination";
  const days = tripData?.duration ? parseInt(tripData.duration) || 7 : 7;

  const suggestedMode = useMemo(
    () => detectSuggestedMode(tripData?.tripTypes, tripData?.objectives),
    [tripData?.tripTypes, tripData?.objectives]
  );

  const [luggageMode, setLuggageMode] = useState<LuggageMode>(suggestedMode || "confort");
  const [transport, setTransport] = useState<TransportMode>("avion");
  const [categories, setCategories] = useState(() => buildCategories(suggestedMode || "confort", "avion"));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const { reached, consume } = useQuota("valise");

  const handleModeChange = useCallback(async (mode: LuggageMode) => {
    if (mode === luggageMode) return;
    setIsSwitchingMode(true);
    setLuggageMode(mode);
    await new Promise((r) => setTimeout(r, 1000));
    setCategories(buildCategories(mode, transport));
    setIsSwitchingMode(false);
    toast.success(`Mode "${mode}" activé`, { description: "La checklist a été adaptée par l'IA." });
  }, [luggageMode, transport]);

  const handleTransportChange = useCallback(async (t: TransportMode) => {
    if (t === transport) return;
    setIsSwitchingMode(true);
    setTransport(t);
    await new Promise((r) => setTimeout(r, 800));
    setCategories(buildCategories(luggageMode, t));
    setIsSwitchingMode(false);
    toast.success(`Transport "${t}" pris en compte 🧳`, { description: "Liste adaptée aux contraintes du trajet." });
  }, [luggageMode, transport]);

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

  const addActivityItems = useCallback((items: string[]) => {
    setCategories((prev) => {
      const catName = "Ajoutés par activité";
      const existing = prev[catName] || [];
      const newItems: ChecklistItem[] = items
        .filter((item) => !existing.some((e) => e.name === item))
        .map((name) => ({ name, description: "", checked: false }));
      if (newItems.length === 0) return prev;
      return { ...prev, [catName]: [...existing, ...newItems] };
    });
  }, []);

  const runGeneration = useCallback(async () => {
    if (reached) { setShowUpgrade(true); return; }
    consume();
    setIsGenerating(true);
    setGenerationStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 450));
      setGenerationStep(i + 1);
      setActiveSection(Math.min(i, 7));
    }
    await new Promise((r) => setTimeout(r, 400));
    setIsGenerating(false);
    setActiveSection(7);
    toast.success("Valise générée ! 🧳", { description: "Checklist personnalisée prête." });
  }, []);

  const handleRegenerate = useCallback(
    async (scope: "all" | "clothes" | "activities") => {
      setIsRegenerating(true);
      toast.loading("Régénération en cours…", { id: "regen" });
      await new Promise((r) => setTimeout(r, 1800));
      setCategories(buildCategories(luggageMode, transport));
      setIsRegenerating(false);
      toast.success(
        scope === "all" ? "Valise régénérée !" : scope === "clothes" ? "Vêtements régénérés !" : "Activités régénérées !",
        { id: "regen" }
      );
    },
    [luggageMode, transport]
  );

  const handleExportPdf = useCallback(() => {
    exportValisePdf({ destination, days, mode: luggageMode, transport, categories });
    toast.success("PDF exporté ! 📄", { description: "Téléchargement lancé." });
  }, [destination, days, luggageMode, transport, categories]);

  const totalItems = Object.values(categories).flat().length;
  const checkedItems = Object.values(categories).flat().filter((i) => i.checked).length;
  const tripTypeLabel = tripData?.tripTypes?.[0] || tripData?.objectives?.[0] || "";

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <QuotaBanner tool="valise" toolLabel="Valise intelligente" />
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} toolName="Valise intelligente" />
      <ValiseHeader checkedItems={checkedItems} totalItems={totalItems} />

      <div className="border-b border-border bg-background/60 backdrop-blur">
        <div className="container mx-auto">
          <StepProgressBar currentStep={activeSection} />
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl space-y-6">
        <ValiseHero destination={destination} days={days} onGenerate={runGeneration} isGenerating={isGenerating} />

        <GenerationAnimation isGenerating={isGenerating} currentStep={generationStep} />

        <VoyageAnalysis tripData={tripData} destination={destination} days={days} />

        <WeatherSection destination={destination} />

        {/* Transport + Mode selection + AI tip */}
        <div className="space-y-4">
          <TransportSelector active={transport} onSelect={handleTransportChange} isLoading={isSwitchingMode} />
          <LuggageModes
            activeMode={luggageMode}
            onSelect={handleModeChange}
            suggestedMode={suggestedMode}
            isLoading={isSwitchingMode}
          />
          <AiTipCard mode={luggageMode} isLoading={isSwitchingMode} />
        </div>

        {/* Dashboard checklist cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Ma checklist</h2>
              <p className="text-xs text-muted-foreground">{checkedItems}/{totalItems} objets sélectionnés</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-bold text-primary">
                {totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0}%
              </span>
            </div>
          </div>
          <ChecklistSection
            categories={categories}
            onToggle={toggleItem}
            onAdd={addItem}
            onRemove={removeItem}
            isLoading={isRegenerating || isSwitchingMode}
          />
        </div>

        <ActivityItems objectives={tripData?.objectives} onAddToChecklist={addActivityItems} />

        <CulturalTips destination={destination} />

        <OutfitRecommendations tripType={tripTypeLabel} destination={destination} />

        <ActionButtons
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          onExportPdf={handleExportPdf}
          onShareTrip={() => setShowShare(true)}
        />

        <ShareTripDialog
          open={showShare}
          onOpenChange={setShowShare}
          destination={destination}
          days={days}
        />

        <ValiseSummary totalItems={totalItems} checkedItems={checkedItems} categoriesCount={Object.keys(categories).length} />
      </div>
      <QuickJump />
    </div>
  );
};

export default GuideValisePage;
