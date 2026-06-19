import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiscoverHero from "@/components/discover/DiscoverHero";
import PlaceCarousel from "@/components/discover/PlaceCarousel";
import PlaceMap from "@/components/discover/PlaceMap";
import PlaceDetailDrawer from "@/components/discover/PlaceDetailDrawer";
import SmartSearch from "@/components/discover/SmartSearch";
import ListsView from "@/components/discover/ListsView";
import DiscoverEntry, { type DiscoverSelection, type DiscoverEntrySlug } from "@/components/discover/DiscoverEntry";
import DiscoverPipChat from "@/components/discover/DiscoverPipChat";
import DiscoverFiltersBar, { DEFAULT_FILTERS, type DiscoverFilters } from "@/components/discover/DiscoverFiltersBar";
import { useDiscover, type Place } from "@/hooks/useDiscover";
import { usePlaceLists } from "@/hooks/usePlaceLists";
import { useNearbyAlerts } from "@/hooks/useNearbyAlerts";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Spec slug → internal Place.category (from src/lib/discover.ts)
const SLUG_TO_CATS: Record<DiscoverEntrySlug, string[]> = {
  gastronomie: ["food"],
  nature: ["nature"],
  culture: ["culture", "experience"],
  vie_nocturne: ["nightlife"],
  shopping: [],
  sport: [],
  bien_etre: ["chill"],
  pepites: [], // handled via hidden_gem flag
  tout: [],
};

function filterBySelection(places: Place[], selection: DiscoverSelection | null): Place[] {
  if (!selection) return places;
  if (selection.slugs.includes("tout")) return places;
  const wantHiddenOnly = selection.slugs.length === 1 && selection.slugs[0] === "pepites";
  if (wantHiddenOnly) return places.filter((p) => p.hidden_gem);
  const cats = new Set(selection.slugs.flatMap((s) => SLUG_TO_CATS[s] ?? []));
  const includeHidden = selection.slugs.includes("pepites");
  if (cats.size === 0 && !includeHidden) return places;
  return places.filter((p) => cats.has(p.category) || (includeHidden && p.hidden_gem));
}

const Discover = () => {
  const { userPos, permission, places, sections, loading, weather, refresh } = useDiscover();
  const { lists, isSaved, toggleItem } = usePlaceLists();
  useNearbyAlerts(userPos, places);
  const [selected, setSelected] = useState<Place | null>(null);
  const [selection, setSelection] = useState<DiscoverSelection | null>(null);
  const [pipOpen, setPipOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const { t } = useTranslation();

  const applyFilters = (arr: Place[]): Place[] => {
    let out = arr.filter((p) => {
      if (p.distance_km != null && p.distance_km > filters.distanceKm) return false;
      if (filters.hiddenOnly && !p.hidden_gem) return false;
      if (filters.minRating > 0 && (p.rating_avg ?? 0) < filters.minRating) return false;
      return true;
    });
    if (filters.sortBy === "near") out = [...out].sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));
    else if (filters.sortBy === "rating") out = [...out].sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0));
    else out = [...out].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return out;
  };

  const filteredPlaces = useMemo(() => applyFilters(filterBySelection(places, selection)), [places, selection, filters]);
  const filteredSections = useMemo(() => {
    const f = (arr: Place[]) => applyFilters(filterBySelection(arr, selection));
    return {
      forYou: f(sections.forYou),
      around: f(sections.around),
      hidden: f(sections.hidden),
      food: f(sections.food),
      experiences: f(sections.experiences),
      chill: f(sections.chill),
    };
  }, [sections, selection, filters]);

  const defaultList = lists.find((l) => l.is_default) || lists[0];
  const handleQuickSave = async (p: Place) => {
    if (!defaultList) return toast.error(t("discoverPage.createListFirst"));
    const added = await toggleItem(defaultList.id, p.id);
    toast.success(added ? t("discoverPage.savedIn", { list: `${defaultList.emoji} ${defaultList.name}` }) : t("discoverPage.removed"));
  };

  const handleEntrySubmit = (sel: DiscoverSelection) => {
    setSelection(sel);
    setPipOpen(false);
  };

  // Entry screen — shown first, before any results
  if (!selection) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
          <DiscoverEntry onSubmit={handleEntrySubmit} onOpenPip={() => setPipOpen(true)} />
        </main>
        <QuickJump />
        {pipOpen && (
          <DiscoverPipChat
            onClose={() => setPipOpen(false)}
            onSubmit={handleEntrySubmit}
          />
        )}
      </div>
    );
  }

  const labels = selection.slugs.map((s) => t(`discoverEntry.cat.${s}`)).join(", ");

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setSelection(null)}
            className="self-start rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground"
          >
            {t("discoverPage.backToEntry")}
          </button>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t("discoverPage.showingFor")}</span>{" "}
            {labels}
          </p>
        </div>

        <DiscoverHero userPos={userPos} weather={weather} loading={loading} onRefresh={refresh} />

        {permission === "denied" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            {t("discoverPage.geoDenied")}
          </div>
        )}

        <DiscoverFiltersBar value={filters} onChange={setFilters} resultCount={filteredPlaces.length} />

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="feed">🔥 {t("discoverPage.tabFeed")}</TabsTrigger>
            <TabsTrigger value="map">🗺️ {t("discoverPage.tabMap")}</TabsTrigger>
            <TabsTrigger value="search">🔍 {t("discoverPage.tabSearch")}</TabsTrigger>
            <TabsTrigger value="lists">❤️ {t("discoverPage.tabLists")}</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-8 pt-6">
            {loading && filteredPlaces.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{t("discoverPage.loadingNearby")}</div>
            )}
            {!userPos && !loading && (
              <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
                {t("discoverPage.waitingPos")}
              </div>
            )}
            {userPos && !loading && filteredPlaces.length === 0 && (
              <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground space-y-3">
                <p>{t("discoverPage.noPlaces")}</p>
                <p className="text-xs">{t("discoverPage.noPlacesHint")}</p>
                <button onClick={refresh} className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">{t("discoverPage.refresh")}</button>
              </div>
            )}
            <PlaceCarousel title={t("discoverPage.secForYou")} emoji="🔥" places={filteredSections.forYou} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secAround")} emoji="📍" places={filteredSections.around} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secHidden")} emoji="✨" places={filteredSections.hidden} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secFood")} emoji="🍝" places={filteredSections.food} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secExperiences")} emoji="🎭" places={filteredSections.experiences} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secChill")} emoji="🌿" places={filteredSections.chill} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
          </TabsContent>

          <TabsContent value="map" className="pt-6">
            <PlaceMap places={filteredPlaces} userPos={userPos} onSelect={setSelected} />
          </TabsContent>

          <TabsContent value="search" className="pt-6">
            <SmartSearch userPos={userPos} onSelect={setSelected} />
          </TabsContent>

          <TabsContent value="lists" className="pt-6">
            <ListsView onSelect={setSelected} />
          </TabsContent>
        </Tabs>
      </main>
      <QuickJump />

      <PlaceDetailDrawer place={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Discover;
