import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTravelStore } from "@/stores/useTravelStore";
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
import ValisePipChat from "@/components/valise/ValisePipChat";
import { toast } from "sonner";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import QuotaBanner from "@/components/shared/QuotaBanner";
import UpgradeDialog from "@/components/shared/UpgradeDialog";
import CollapsibleSection from "@/components/shared/CollapsibleSection";
import { useQuota } from "@/hooks/useQuota";
import { useHydrateActiveTrip } from "@/hooks/useHydrateActiveTrip";

import { buildCategories, detectSuggestedMode } from "./guide-valise-data";


const GuideValisePage = () => {
  useHydrateActiveTrip();
  const { tripData } = useTravelStore();
  const { t, i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  const destination = tripData?.destination || (isFr ? "votre destination" : "your destination");
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

  // ── Persistence (localStorage) ─────────────────────────────
  const storageKey = useMemo(
    () => `valise:state:v1:${destination}:${luggageMode}:${transport}`,
    [destination, luggageMode, transport],
  );
  const hydratedRef = useRef<string | null>(null);

  // Hydrate when key changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, ChecklistItem[]>;
        if (parsed && typeof parsed === "object") {
          setCategories(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    hydratedRef.current = storageKey;
  }, [storageKey]);

  // Save on change (after hydration for this key)
  useEffect(() => {
    if (hydratedRef.current !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(categories));
    } catch {
      /* ignore quota errors */
    }
  }, [categories, storageKey]);

  const handleModeChange = useCallback(async (mode: LuggageMode) => {
    if (mode === luggageMode) return;
    setIsSwitchingMode(true);
    setLuggageMode(mode);
    await new Promise((r) => setTimeout(r, 1000));
    setCategories(buildCategories(mode, transport));
    setIsSwitchingMode(false);
    toast.success(t("guideValise.toastModeOn", { mode }), { description: t("guideValise.toastModeOnDesc") });
  }, [luggageMode, transport, t]);

  const handleTransportChange = useCallback(async (tr: TransportMode) => {
    if (tr === transport) return;
    setIsSwitchingMode(true);
    setTransport(tr);
    await new Promise((r) => setTimeout(r, 800));
    setCategories(buildCategories(luggageMode, tr));
    setIsSwitchingMode(false);
    toast.success(t("guideValise.toastTransport", { mode: tr }), { description: t("guideValise.toastTransportDesc") });
  }, [luggageMode, transport, t]);

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
    toast.success(t("guideValise.toastItemAdded"));
  };

  const removeItem = (cat: string, idx: number) => {
    setCategories((prev) => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== idx),
    }));
    toast(t("guideValise.toastItemRemoved"));
  };

  const addItemsToCategory = useCallback((catName: string, items: string[]) => {
    setCategories((prev) => {
      const existing = prev[catName] || [];
      const newItems: ChecklistItem[] = items
        .filter((item) => !existing.some((e) => e.name.toLowerCase() === item.toLowerCase()))
        .map((name) => ({ name, description: "", checked: false }));
      if (newItems.length === 0) return prev;
      return { ...prev, [catName]: [...existing, ...newItems] };
    });
  }, []);

  const addActivityItems = useCallback((items: string[]) => {
    addItemsToCategory("Ajoutés par activité", items);
  }, [addItemsToCategory]);

  const addOutfitItems = useCallback((items: string[]) => {
    addItemsToCategory("Tenues recommandées", items);
  }, [addItemsToCategory]);


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
    toast.success(t("guideValise.toastValiseReady"), { description: t("guideValise.toastValiseReadyDesc") });
  }, [t, consume, reached]);

  const handleRegenerate = useCallback(
    async (scope: "all" | "clothes" | "activities") => {
      setIsRegenerating(true);
      toast.loading(t("guideValise.toastRegen"), { id: "regen" });
      await new Promise((r) => setTimeout(r, 1800));
      setCategories(buildCategories(luggageMode, transport));
      setIsRegenerating(false);
      const msg =
        scope === "all" ? t("guideValise.toastRegenAll")
        : scope === "clothes" ? t("guideValise.toastRegenClothes")
        : t("guideValise.toastRegenActivities");
      toast.success(msg, { id: "regen" });
    },
    [luggageMode, transport, t]
  );

  const handleExportPdf = useCallback(() => {
    exportValisePdf({ destination, days, mode: luggageMode, transport, categories });
    toast.success(t("guideValise.toastPdf"), { description: t("guideValise.toastPdfDesc") });
  }, [destination, days, luggageMode, transport, categories, t]);

  const handleValidateAll = useCallback(() => {
    setCategories((prev) => {
      const next: Record<string, ChecklistItem[]> = {};
      for (const [cat, items] of Object.entries(prev)) {
        next[cat] = items.map((i) => ({ ...i, checked: true }));
      }
      return next;
    });
    toast.success(t("valise.toastValidated"), { description: t("valise.toastValidatedDesc") });
  }, [t]);

  const handleResetAll = useCallback(() => {
    setCategories((prev) => {
      const next: Record<string, ChecklistItem[]> = {};
      for (const [cat, items] of Object.entries(prev)) {
        next[cat] = items.map((i) => ({ ...i, checked: false }));
      }
      return next;
    });
    toast.success(t("valise.toastReset"));
  }, [t]);

  const handleDuplicate = useCallback(async () => {
    const lines: string[] = [`🧳 ${destination} — ${days}j`, ""];
    for (const [cat, items] of Object.entries(categories)) {
      lines.push(`▸ ${cat}`);
      for (const it of items) {
        lines.push(`  ${it.checked ? "[x]" : "[ ]"} ${it.name}${it.description ? ` — ${it.description}` : ""}`);
      }
      lines.push("");
    }
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("valise.toastDuplicated"));
    } catch {
      toast.error(t("valise.toastDuplicateError"));
    }
  }, [categories, destination, days, t]);

  const handleSaveTemplate = useCallback(() => {
    try {
      const key = "valise:templates:v1";
      const raw = localStorage.getItem(key);
      const list = raw ? (JSON.parse(raw) as Array<{ id: string; name: string; savedAt: number; categories: Record<string, ChecklistItem[]> }>) : [];
      const name = `${destination} · ${luggageMode}`;
      list.unshift({ id: `tpl_${Date.now()}`, name, savedAt: Date.now(), categories });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 20)));
      toast.success(t("valise.toastTemplateSaved"), { description: t("valise.toastTemplateSavedDesc") });
    } catch {
      toast.error(t("valise.toastTemplateError"));
    }
  }, [destination, luggageMode, categories, t]);

  const totalItems = Object.values(categories).flat().length;
  const checkedItems = Object.values(categories).flat().filter((i) => i.checked).length;
  const remainingByCategory = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [cat, items] of Object.entries(categories)) {
      out[cat] = items.filter((i) => !i.checked).length;
    }
    return out;
  }, [categories]);
  const tripTypeLabel = tripData?.tripTypes?.[0] || tripData?.objectives?.[0] || "";

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <QuotaBanner tool="valise" toolLabel="Valise intelligente" />
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} toolName="Valise intelligente" />
      <div className="container mx-auto px-6 py-8 max-w-5xl space-y-6">
        <ValiseHero destination={destination} days={days} onGenerate={runGeneration} isGenerating={isGenerating} checkedItems={checkedItems} totalItems={totalItems} />

        <GenerationAnimation isGenerating={isGenerating} currentStep={generationStep} />

        <VoyageAnalysis tripData={tripData} destination={destination} days={days} />

        <div id="weather-section"><WeatherSection destination={destination} /></div>

        {/* Transport + Mode selection + AI tip */}
        <div className="space-y-4">
          <TransportSelector active={transport} onSelect={handleTransportChange} isLoading={isSwitchingMode} />
          <LuggageModes
            activeMode={luggageMode}
            onSelect={handleModeChange}
            suggestedMode={suggestedMode}
            isLoading={isSwitchingMode}
          />
          <AiTipCard mode={luggageMode} isLoading={isSwitchingMode} destination={destination} />
        </div>

        {/* Dashboard checklist cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{t("guideValise.myChecklist")}</h2>
              <p className="text-xs text-muted-foreground">{t("guideValise.itemsSelected", { checked: checkedItems, total: totalItems })}</p>
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

        <CollapsibleSection
          title={t("collapsible.valise.activities")}
          subtitle={t("collapsible.valise.activitiesSub")}
        >
          <ActivityItems objectives={tripData?.objectives} onAddToChecklist={addActivityItems} />
        </CollapsibleSection>

        <CollapsibleSection
          title={t("collapsible.valise.cultural")}
          subtitle={t("collapsible.valise.culturalSub")}
        >
          <CulturalTips destination={destination} tripType={tripTypeLabel} />
        </CollapsibleSection>

        <CollapsibleSection
          title={t("collapsible.valise.outfits")}
          subtitle={t("collapsible.valise.outfitsSub")}
        >
          <OutfitRecommendations
            tripType={tripTypeLabel}
            destination={destination}
            activities={tripData?.objectives}
            luggage={luggageMode}
            onAddToChecklist={addOutfitItems}
          />
        </CollapsibleSection>

        <ActionButtons
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          onExportPdf={handleExportPdf}
          onShareTrip={() => setShowShare(true)}
          onValidateAll={handleValidateAll}
          onResetAll={handleResetAll}
          onDuplicate={handleDuplicate}
          onSaveTemplate={handleSaveTemplate}
        />

        <ShareTripDialog
          open={showShare}
          onOpenChange={setShowShare}
          destination={destination}
          days={days}
        />

        <CollapsibleSection
          title={t("collapsible.valise.summary")}
          subtitle={t("collapsible.valise.summarySub")}
        >
          <ValiseSummary
            totalItems={totalItems}
            checkedItems={checkedItems}
            categoriesCount={Object.keys(categories).length}
            remainingByCategory={remainingByCategory}
          />
        </CollapsibleSection>
      </div>
      <QuickJump />
      <ValisePipChat destination={destination} />
    </div>
  );
};

export default GuideValisePage;
