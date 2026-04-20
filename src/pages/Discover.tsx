import { useState } from "react";
import AppNavbar from "@/components/shared/AppNavbar";
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

  const defaultList = lists.find((l) => l.is_default) || lists[0];
  const handleQuickSave = async (p: Place) => {
    if (!defaultList) return toast.error("Crée une liste d'abord");
    const added = await toggleItem(defaultList.id, p.id);
    toast.success(added ? `Sauvegardé dans ${defaultList.emoji} ${defaultList.name}` : "Retiré");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
        <DiscoverHero userPos={userPos} weather={weather} loading={loading} onRefresh={refresh} />

        {permission === "denied" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            🚫 Géolocalisation refusée. Active-la dans les réglages du navigateur pour des recos précises.
          </div>
        )}

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="feed">🔥 Pour toi</TabsTrigger>
            <TabsTrigger value="map">🗺️ Carte</TabsTrigger>
            <TabsTrigger value="search">🔍 Recherche</TabsTrigger>
            <TabsTrigger value="lists">❤️ Mes listes</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-8 pt-6">
            {loading && places.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Chargement des lieux autour de toi…</div>
            )}
            {!userPos && !loading && (
              <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
                📍 En attente de ta position pour générer des recommandations…
              </div>
            )}
            {userPos && !loading && places.length === 0 && (
              <div className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground space-y-3">
                <p>🔍 Aucun lieu trouvé autour de toi pour le moment.</p>
                <p className="text-xs">Essaie la recherche pour explorer une autre zone, ou rafraîchis dans quelques secondes.</p>
                <button onClick={refresh} className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">Rafraîchir</button>
              </div>
            )}
            <PlaceCarousel title="Pour toi" emoji="🔥" places={sections.forYou} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title="Autour de toi" emoji="📍" places={sections.around} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title="Hidden gems" emoji="✨" places={sections.hidden} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title="Restaurants & Cafés" emoji="🍝" places={sections.food} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title="Activités & Culture" emoji="🎭" places={sections.experiences} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
            <PlaceCarousel title="Chill & Nature" emoji="🌿" places={sections.chill} onSelect={setSelected} isSaved={isSaved} onToggleSave={handleQuickSave} />
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

      <PlaceDetailDrawer place={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Discover;
