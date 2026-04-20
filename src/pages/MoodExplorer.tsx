import { useEffect, useState } from "react";
import { Sparkles, Heart, History as HistoryIcon, Map as MapIcon, Trophy, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useMoodExplorer, type MoodPlace } from "@/hooks/useMoodExplorer";
import { useMoodBadges } from "@/hooks/useMoodBadges";
import { getReactionsCount } from "@/hooks/useMoodSocial";
import { useAuth } from "@/hooks/useAuth";
import MoodHero from "@/components/mood/MoodHero";
import MoodSelector from "@/components/mood/MoodSelector";
import MoodFeed from "@/components/mood/MoodFeed";
import MoodFavorites from "@/components/mood/MoodFavorites";
import MoodMap from "@/components/mood/MoodMap";
import MoodAmbience from "@/components/mood/MoodAmbience";
import MoodBadgesPanel from "@/components/mood/MoodBadgesPanel";
import PopularMoods from "@/components/mood/PopularMoods";
import SocialReactions from "@/components/mood/SocialReactions";
import MoodPlaceCard from "@/components/mood/MoodPlaceCard";
import { moodByKey } from "@/lib/moods";
import AppNavbar from "@/components/shared/AppNavbar";

const MoodExplorer = () => {
  const { user } = useAuth();
  const {
    places, favorites, history, loading, activeMood, position, weather,
    recommend, toggleFavorite, isFavorite, reset, badgeContext,
  } = useMoodExplorer();

  const { badges, evaluate } = useMoodBadges();
  const [tab, setTab] = useState("feed");
  const [detailsPlace, setDetailsPlace] = useState<MoodPlace | null>(null);
  const [reactionsCount, setReactionsCount] = useState(0);

  // Load reactions count for current user
  useEffect(() => {
    if (!user) return;
    getReactionsCount(user.id).then(setReactionsCount);
  }, [user, detailsPlace]);

  // Evaluate badges whenever context changes
  useEffect(() => {
    if (!user) return;
    evaluate({ ...badgeContext, reactionsCount });
  }, [user, badgeContext.distinctMoods, badgeContext.favoritesCount, badgeContext.hiddenGemsSaved, badgeContext.totalSelections, reactionsCount, evaluate]);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <MoodHero
              activeMood={activeMood}
              weather={weather}
              position={position}
              onReset={() => { reset(); setTab("feed"); }}
            />
          </div>
          <MoodAmbience mood={activeMood} />
        </div>

        {!activeMood || places.length === 0 ? (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <MoodSelector loading={loading} onSubmit={recommend} />
            <aside className="space-y-6">
              <PopularMoods onSelectMood={(m) => recommend({ mood: m as any })} />
              <MoodBadgesPanel badges={badges} />
            </aside>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="feed"><Sparkles className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Feed</span></TabsTrigger>
              <TabsTrigger value="map"><MapIcon className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Carte</span></TabsTrigger>
              <TabsTrigger value="favorites"><Heart className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Favoris</span> ({favorites.length})</TabsTrigger>
              <TabsTrigger value="badges"><Trophy className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Badges</span> ({badges.length})</TabsTrigger>
              <TabsTrigger value="social"><Users className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Social</span></TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-4">
              <MoodFeed
                places={places}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onOpenDetails={setDetailsPlace}
              />
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              <MoodMap places={places} userPosition={position} onSelect={setDetailsPlace} />
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              <MoodFavorites favorites={favorites} onToggleFavorite={toggleFavorite} />
            </TabsContent>

            <TabsContent value="badges" className="mt-4">
              <MoodBadgesPanel badges={badges} />
            </TabsContent>

            <TabsContent value="social" className="mt-4">
              <PopularMoods onSelectMood={(m) => { reset(); recommend({ mood: m as any }); }} />
            </TabsContent>
          </Tabs>
        )}

        {/* Historique en pied */}
        {history.length > 0 && !activeMood && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HistoryIcon className="w-4 h-4 text-primary" /> Tes derniers moods
            </div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 6).map((h: any) => {
                const m = moodByKey(h.mood);
                return (
                  <button
                    key={h.id}
                    onClick={() => recommend({ mood: h.mood, free_input: h.free_input || undefined, energy_level: h.energy_level ?? undefined })}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card/40 hover:border-primary/40 transition-colors"
                  >
                    {m?.emoji} {m?.label || h.mood}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeMood && places.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="sm" onClick={() => { reset(); setTab("feed"); }}>
              ← Choisir un autre mood
            </Button>
          </div>
        )}
      </div>

      {/* Drawer détails + social */}
      <Drawer open={!!detailsPlace} onOpenChange={(o) => !o && setDetailsPlace(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{detailsPlace?.name}</DrawerTitle>
          </DrawerHeader>
          {detailsPlace && (
            <div className="px-4 pb-6 space-y-4 overflow-y-auto">
              <MoodPlaceCard
                place={detailsPlace}
                isFavorite={isFavorite(detailsPlace.id)}
                onToggleFavorite={() => toggleFavorite(detailsPlace)}
              />
              <SocialReactions
                place={detailsPlace}
                onShared={() => user && getReactionsCount(user.id).then(setReactionsCount)}
              />
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MoodExplorer;
