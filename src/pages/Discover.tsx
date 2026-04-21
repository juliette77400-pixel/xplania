import { useState } from "react";
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
import { useDiscover, type Place } from "@/hooks/useDiscover";
import { usePlaceLists } from "@/hooks/usePlaceLists";
import { useNearbyAlerts } from "@/hooks/useNearbyAlerts";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Discover = () => {
  const { userPos, permission, places, sections, loading, weather, refresh } = useDiscover();
  const { lists, isSaved, toggleItem } = usePlaceLists();
  useNearbyAlerts(userPos, places);
  const [selected, setSelected] = useState<Place | null>(null);
  const { t } = useTranslation();

  const defaultList = lists.find((l) => l.is_default) || lists[0];
  const handleQuickSave = async (p: Place) => {
    if (!defaultList) return toast.error(t("discoverPage.createListFirst"));
    const added = await toggleItem(defaultList.id, p.id);
    toast.success(added ? t("discoverPage.savedIn", { list: `${defaultList.emoji} ${defaultList.name}` }) : t("discoverPage.removed"));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
        <DiscoverHero userPos={userPos} weather={weather} loading={loading} onRefresh={refresh} />

        {permission === "denied" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            {t("discoverPage.geoDenied")}
          </div>
        )}

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="feed">🔥 {t("discoverPage.tabFeed")}</TabsTrigger>
            <TabsTrigger value="map">🗺️ {t("discoverPage.tabMap")}</TabsTrigger>
            <TabsTrigger value="search">🔍 {t("discoverPage.tabSearch")}</TabsTrigger>
            <TabsTrigger value="lists">❤️ {t("discoverPage.tabLists")}</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-8 pt-6">
            {loading && places.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{t("discoverPage.loadingNearby")}</div>
            )}
            {!userPos && !loading && (
              <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
                {t("discoverPage.waitingPos")}
              </div>
            )}
            {userPos && !loading && places.length === 0 && (
              <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground space-y-3">
                <p>{t("discoverPage.noPlaces")}</p>
                <p className="text-xs">{t("discoverPage.noPlacesHint")}</p>
                <button onClick={refresh} className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">{t("discoverPage.refresh")}</button>
              </div>
            )}
            <PlaceCarousel title={t("discoverPage.secForYou")} emoji="🔥" places={sections.forYou} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secAround")} emoji="📍" places={sections.around} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secHidden")} emoji="✨" places={sections.hidden} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secFood")} emoji="🍝" places={sections.food} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secExperiences")} emoji="🎭" places={sections.experiences} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title={t("discoverPage.secChill")} emoji="🌿" places={sections.chill} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
          </TabsContent>

          <TabsContent value="map" className="pt-6">
            <PlaceMap places={places} userPos={userPos} onSelect={setSelected} />
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
