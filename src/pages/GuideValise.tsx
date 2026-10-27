import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTravelStore } from "@/stores/useTravelStore";
import { saveModuleProgress } from "@/lib/prep-progress";
import ValiseHero from "@/components/valise/ValiseHero";
import GenerationAnimation, { STEPS } from "@/components/valise/GenerationAnimation";
import VoyageAnalysis from "@/components/valise/VoyageAnalysis";
import ClimateSection from "@/components/valise/ClimateSection";
import { suggestProfile } from "@/lib/valise-profiles";
import { findCountry } from "@/lib/country-match";
import LuggageModes, { type LuggageMode } from "@/components/valise/LuggageModes";
import TransportSelector, { type TransportMode } from "@/components/valise/TransportSelector";
import ShareTripDialog from "@/components/valise/ShareTripDialog";
import AiTipCard from "@/components/valise/AiTipCard";
import ChecklistSection, { type ChecklistItem } from "@/components/valise/ChecklistSection";
import MissingItemsCheck from "@/components/valise/MissingItemsCheck";
import ActivityItems from "@/components/valise/ActivityItems";
import ValiseActivitiesPicker from "@/components/valise/ValiseActivitiesPicker";
import CurrentWeatherCard from "@/components/valise/CurrentWeatherCard";
import { useClimateMonths, climateSummary } from "@/hooks/useClimateMonths";
import { activityChecklist, cleanActivities, type ValiseActivity } from "@/lib/valise-activities";
import { isTransportMode } from "@/components/valise/TransportSelector";
import { useActiveTrip } from "@/stores/useActiveTrip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TravelFormData } from "@/types/travel";
import OutfitRecommendations from "@/components/valise/OutfitRecommendations";
import ActionButtons from "@/components/valise/ActionButtons";
import ValiseSummary from "@/components/valise/ValiseSummary";
import ValisePipChat from "@/components/valise/ValisePipChat";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import AppNavbar from "@/components/shared/AppNavbar";
import MissingTripInfo from "@/components/shared/MissingTripInfo";
import QuickJump from "@/components/shared/QuickJump";
import QuotaBanner from "@/components/shared/QuotaBanner";
import UpgradeDialog from "@/components/shared/UpgradeDialog";
import CollapsibleSection from "@/components/shared/CollapsibleSection";
import ExampleResultPreview from "@/components/shared/ExampleResultPreview";
import { useQuota } from "@/hooks/useQuota";
import { useHydrateActiveTrip } from "@/hooks/useHydrateActiveTrip";

import { buildCategories } from "./guide-valise-data";


const GuideValisePage = () => {
  useHydrateActiveTrip();
  const { tripData, setTripData } = useTravelStore();
  const { t, i18n } = useTranslation();
  const lang: "fr" | "en" = i18n.language?.startsWith("en") ? "en" : "fr";
  const { user } = useAuth();
  const tripId = useActiveTrip((s) => s.tripId);
  const destination = tripData?.destination || t("ui2.GuideValise.destinationFallback");
  const days = tripData?.duration ? parseInt(tripData.duration) || 7 : 7;

  const suggestedMode = useMemo(() => suggestProfile(tripData?.stayType, days), [tripData?.stayType, days]);

  const [luggageMode, setLuggageMode] = useState<LuggageMode>(suggestedMode);
  useEffect(() => { setLuggageMode(suggestedMode); }, [suggestedMode]);
  // Choices saved with the trip: activities and transport come back on every visit.
  const savedTransport = isTransportMode(tripData?.valiseTransport) ? tripData!.valiseTransport as TransportMode : "avion";
  const [transport, setTransport] = useState<TransportMode>(savedTransport);
  useEffect(() => { setTransport(savedTransport); }, [savedTransport]);
  const activitiesKey = (tripData?.valiseActivities || []).join(",");
  const activities = useMemo<ValiseActivity[]>(() => cleanActivities(tripData?.valiseActivities), [activitiesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const activityOther = tripData?.valiseActivityOther || "";
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [categories, setCategories] = useState(() => {
    return buildCategories(suggestProfile(tripData?.stayType, days), savedTransport, activities, activityOther);
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const { reached, consume } = useQuota("valise");

  // Whether the suitcase has been generated for this destination. The checklist,
  // readiness % and all result sections only appear (and only count) once the
  // user has actually generated — fixes the "73% before generating" bug.
  const genKey = useMemo(() => `valise:gen:v1:${destination}`, [destination]);
  const [hasGenerated, setHasGenerated] = useState<boolean>(() => {
    try { return localStorage.getItem(genKey) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { setHasGenerated(localStorage.getItem(genKey) === "1"); } catch { /* ignore */ }
  }, [genKey]);

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
      } else {
        setCategories(buildCategories(luggageMode, transport, activities, activityOther));
      }
    } catch {
      /* ignore */
    }
    hydratedRef.current = storageKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setCategories(buildCategories(mode, transport, activities, activityOther));
    setIsSwitchingMode(false);
    toast.success(t("guideValise.toastModeOn", { mode: t(`valise2.profiles.${mode}.label`) }), { description: t("guideValise.toastModeOnDesc") });
  }, [luggageMode, transport, t]);

  /** Merges Valise choices into the trip's saved answers (other answers are never overwritten). */
  const savePrefs = useCallback(async (patch: Partial<TravelFormData>): Promise<boolean> => {
    if (tripData) setTripData({ ...tripData, ...patch });
    if (!user || !tripId) return true;
    setSavingPrefs(true);
    try {
      const { data: row, error: readErr } = await supabase.from("trips").select("form_data").eq("id", tripId).eq("user_id", user.id).maybeSingle();
      if (readErr || !row) throw readErr ?? new Error("trip not found");
      const next = { ...((row.form_data as Record<string, unknown>) || {}), ...patch };
      const { error } = await supabase.from("trips").update({ form_data: next as never }).eq("id", tripId).eq("user_id", user.id);
      if (error) throw error;
      return true;
    } catch {
      toast.error(t("valise3.activities.saveError"));
      return false;
    } finally {
      setSavingPrefs(false);
    }
  }, [tripData, setTripData, user, tripId, t]);

  const handleTransportChange = useCallback(async (tr: TransportMode) => {
    if (tr === transport) return;
    setIsSwitchingMode(true);
    setTransport(tr);
    const saved = savePrefs({ valiseTransport: tr });
    await new Promise((r) => setTimeout(r, 800));
    setCategories(buildCategories(luggageMode, tr, activities, activityOther));
    setIsSwitchingMode(false);
    if (await saved) toast.success(t("guideValise.toastTransport", { mode: t(`valise.transports.${tr}`) }), { description: t("valise3.transportSaved") });
  }, [luggageMode, transport, t, savePrefs, activities, activityOther]);

  const handleActivitiesChange = useCallback(async (next: ValiseActivity[], other: string) => {
    const added = next.filter((a) => !activities.includes(a));
    const otherAdded = other && other !== activityOther ? other : "";
    const ok = await savePrefs({ valiseActivities: next, valiseActivityOther: other });
    // The list follows right away: items for newly chosen activities are added (nothing is removed).
    const extra = activityChecklist(added, otherAdded, lang === "en");
    for (const [cat, items] of Object.entries(extra)) {
      setCategories((prev) => {
        const existing = prev[cat] || [];
        const fresh = items.filter((i) => !existing.some((e) => e.name.toLowerCase() === i.name.toLowerCase()));
        return fresh.length ? { ...prev, [cat]: [...existing, ...fresh] } : prev;
      });
    }
    if (ok) toast.success(t("valise3.activities.saved"));
  }, [activities, activityOther, savePrefs, lang, t]);

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
    addItemsToCategory(t("ui2.GuideValise.categoryActivityAdded"), items);
  }, [addItemsToCategory, t]);

  const addOutfitItems = useCallback((items: string[]) => {
    addItemsToCategory(t("ui2.GuideValise.categoryOutfitRecommended"), items);
  }, [addItemsToCategory, t]);


  const runGeneration = useCallback(async () => {
    if (reached) { setShowUpgrade(true); return; }
    consume();
    // Build a fresh checklist that respects the current transport + luggage type,
    // with nothing checked yet (so readiness starts at 0%).
    setCategories(buildCategories(luggageMode, transport, activities, activityOther));
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
    setHasGenerated(true);
    try { localStorage.setItem(genKey, "1"); } catch { /* ignore */ }
    track("guide_generated", { guide: "valise" });
    toast.success(t("guideValise.toastValiseReady"), { description: t("guideValise.toastValiseReadyDesc") });
  }, [t, consume, reached, luggageMode, transport, genKey, activities, activityOther]);

  const handleRegenerate = useCallback(
    async (scope: "all" | "clothes" | "activities") => {
      setIsRegenerating(true);
      toast.loading(t("guideValise.toastRegen"), { id: "regen" });
      await new Promise((r) => setTimeout(r, 1800));
      setCategories(buildCategories(luggageMode, transport, activities, activityOther));
      setIsRegenerating(false);
      const msg =
        scope === "all" ? t("guideValise.toastRegenAll")
        : scope === "clothes" ? t("guideValise.toastRegenClothes")
        : t("guideValise.toastRegenActivities");
      toast.success(msg, { id: "regen" });
    },
    [luggageMode, transport, t, activities, activityOther]
  );

  const handleExportPdf = useCallback(async () => {
    const { exportValisePdf } = await import("@/lib/valise-export");
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

  // Dashboard summary: "Valise : 12/30 éléments cochés".
  useEffect(() => {
    if (!hasGenerated) return;
    saveModuleProgress("valise", tripData?.destination, { done: checkedItems, total: totalItems });
  }, [hasGenerated, checkedItems, totalItems, tripData?.destination]);
  const remainingByCategory = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [cat, items] of Object.entries(categories)) {
      out[cat] = items.filter((i) => !i.checked).length;
    }
    return out;
  }, [categories]);
  const tripTypeLabel = tripData?.tripTypes?.[0] || tripData?.objectives?.[0] || "";
  // Labels of the chosen activities, as sent to the AI tips and outfits.
  const activityLabels = useMemo(
    () => [...activities.map((a) => t(`valise3.activities.items.${a}`)), ...(activityOther ? [activityOther] : [])],
    [activities, activityOther, t],
  );
  const weatherCity = tripData?.arrivalCity || tripData?.destination || "";
  const countryCode = findCountry(tripData?.destination);
  const climateQ = useClimateMonths(weatherCity, countryCode, tripData?.departureDate || null, tripData?.returnDate || null, lang);
  const climate = climateSummary(climateQ.data, lang);
  const stayDates = tripData?.departureDate ? `${tripData.departureDate} → ${tripData.returnDate || ""}` : "";

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <QuotaBanner tool="valise" toolLabel={t("ui2.GuideValise.toolLabel")} />
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} toolName={t("ui2.GuideValise.toolLabel")} />
      <div className="container mx-auto px-6 py-8 max-w-5xl space-y-6">
        <MissingTripInfo needs={["dates"]} />
        <ValiseHero destination={destination} days={days} onGenerate={runGeneration} isGenerating={isGenerating} checkedItems={checkedItems} totalItems={totalItems} showProgress={hasGenerated} showCta={false} />

        <GenerationAnimation isGenerating={isGenerating} currentStep={generationStep} />

        <VoyageAnalysis tripData={tripData} destination={destination} days={days} />

        <ValiseActivitiesPicker value={activities} other={activityOther} saving={savingPrefs} onChange={(next, other) => void handleActivitiesChange(next, other)} />

        <div id="weather-section" className="space-y-4">
          {weatherCity && <CurrentWeatherCard city={weatherCity} countryCode={countryCode} />}
          <ClimateSection
            city={weatherCity}
            countryCode={countryCode}
            start={tripData?.departureDate || null}
            end={tripData?.returnDate || null}
            onAdd={(items) => addItemsToCategory(t("valise2.climate.category"), items)}
          />
        </div>

        {/* Transport + Mode selection + AI tip */}
        <div className="space-y-4">
          <TransportSelector active={transport} onSelect={handleTransportChange} isLoading={isSwitchingMode} />
          <LuggageModes
            activeMode={luggageMode}
            onSelect={handleModeChange}
            suggestedMode={suggestedMode}
            isLoading={isSwitchingMode}
          />
          <AiTipCard mode={luggageMode} isLoading={isSwitchingMode} destination={tripData?.arrivalCity && tripData.arrivalCity !== tripData.destination ? `${tripData.arrivalCity}, ${destination}` : destination} months={stayDates} activities={activityLabels} stayType={tripData?.stayType} transport={t(`valise.transports.${transport}`)} days={days} climate={climate} />
        </div>

        {/* Generate CTA — placed after the transport + luggage-type choices so the
            suitcase respects them. Hidden once generated. */}
        {!hasGenerated && (
          <ExampleResultPreview
            title={t("guidePreview.valise.title")}
            rows={[
              { label: t("guidePreview.valise.i1") },
              { label: t("guidePreview.valise.i2") },
              { label: t("guidePreview.valise.i3") },
            ]}
            note={t("guidePreview.valise.note")}
          />
        )}

        {!hasGenerated && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-6 text-center">
            <p className="max-w-md text-sm text-muted-foreground">{t("valise.generateHint")}</p>
            <button
              onClick={runGeneration}
              disabled={isGenerating}
              className="gradient-button inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {t("valise.heroCta")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {hasGenerated && (<>
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

        <MissingItemsCheck
          destination={destination}
          days={days}
          tripTypes={tripData?.tripTypes}
          activities={activityLabels}
          luggage={luggageMode}
          transport={transport}
          departureDate={tripData?.departureDate}
          currentItems={Object.values(categories).flat().map((i) => i.name)}
          onAdd={(name) => addItemsToCategory(t("valise.missing.category"), [name])}
        />

        <CollapsibleSection
          title={t("collapsible.valise.activities")}
          subtitle={t("collapsible.valise.activitiesSub")}
        >
          <ActivityItems objectives={[...activityLabels, ...(tripData?.objectives || []), ...(tripData?.tripTypes || [])]} onAddToChecklist={addActivityItems} />
        </CollapsibleSection>

        {/* General cultural codes live in the Culture guide; outfits keep the dress-code advice. */}
        <CollapsibleSection
          title={t("collapsible.valise.outfits")}
          subtitle={t("collapsible.valise.outfitsSub")}
        >
          <OutfitRecommendations
            tripType={tripTypeLabel}
            destination={destination}
            activities={activityLabels}
            luggage={luggageMode}
            onAddToChecklist={addOutfitItems}
            climate={climate}
            stayType={tripData?.stayType}
            city={tripData?.arrivalCity && tripData.arrivalCity !== tripData.destination ? tripData.arrivalCity : ""}
            dates={stayDates}
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
        </>)}
      </div>
      <QuickJump />
      <ValisePipChat destination={destination} />
    </div>
  );
};

export default GuideValisePage;
