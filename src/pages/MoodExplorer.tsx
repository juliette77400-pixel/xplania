import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Heart, History as HistoryIcon, Map as MapIcon, Trophy, Users, LineChart as LineChartIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMoodExplorer, type MoodPlace } from "@/hooks/useMoodExplorer";
import { useMoodBadges } from "@/hooks/useMoodBadges";
import { getReactionsCount } from "@/hooks/useMoodSocial";
import { useMoodEntries } from "@/hooks/useMoodEntries";
import { useAuth } from "@/hooks/useAuth";
import MoodHero from "@/components/mood/MoodHero";
import MoodSelector from "@/components/mood/MoodSelector";
import MoodFeed from "@/components/mood/MoodFeed";
import MoodFavorites from "@/components/mood/MoodFavorites";
import MoodMap from "@/components/mood/MoodMap";
import MoodAmbience from "@/components/mood/MoodAmbience";
import MoodAiAnalysis from "@/components/mood/MoodAiAnalysis";
import MoodBadgesPanel from "@/components/mood/MoodBadgesPanel";
import PopularMoods from "@/components/mood/PopularMoods";
import MoodPlaceDetail from "@/components/mood/MoodPlaceDetail";
import MoodEntryCards from "@/components/mood/MoodEntryCards";
import MoodPipChat from "@/components/mood/MoodPipChat";
import MoodTrackerPanel from "@/components/mood/MoodTrackerPanel";
import MoodRatingDialog from "@/components/mood/MoodRatingDialog";
import { moodByKey } from "@/lib/moods";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import QuotaBanner from "@/components/shared/QuotaBanner";
import UpgradeDialog from "@/components/shared/UpgradeDialog";
import { useQuota } from "@/hooks/useQuota";

const MoodExplorer = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    places, favorites, history, loading, activeMood, position, weather,
    recommend, toggleFavorite, isFavorite, reset, badgeContext,
  } = useMoodExplorer();

  const { badges, evaluate } = useMoodBadges();
  const [tab, setTab] = useState("feed");
  const [detailsPlace, setDetailsPlace] = useState<MoodPlace | null>(null);
  const [reactionsCount, setReactionsCount] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [mode, setMode] = useState<"entry" | "pip" | "form">("entry");

  const { reached, consume } = useQuota("mood");

  // Premium-gated recommend: consume one quota credit per call. When exhausted,
  // open the Upgrade dialog instead of running the recommendation.
  const guardedRecommend: typeof recommend = useCallback(
    (input) => {
      if (reached) {
        setUpgradeOpen(true);
        return Promise.resolve();
      }
      consume();
      return recommend(input);
    },
    [reached, consume, recommend],
  );

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
        <QuotaBanner tool="mood" toolLabel="Mood Explorer" />

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

        {activeMood && places.length > 0 && (
          <MoodAiAnalysis mood={activeMood} energyLevel={(history[0] as any)?.energy_level ?? 50} placesCount={places.length} />
        )}

        {!activeMood || places.length === 0 ? (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              {mode === "entry" && (
                <MoodEntryCards
                  disabled={loading}
                  onPickPip={() => setMode("pip")}
                  onPickForm={() => setMode("form")}
                  onPickSolo={() =>
                    guardedRecommend({
                      mood: "chill",
                      free_input:
                        "Solo walk near me, calm, about 1h, walking distance",
                      energy_level: 25,
                    })
                  }
                />
              )}
              {mode === "pip" && (
                <MoodPipChat
                  loading={loading}
                  onClose={() => setMode("entry")}
                  onSubmit={guardedRecommend}
                />
              )}
              {mode === "form" && (
                <div className="space-y-3">
                  <button
                    onClick={() => setMode("entry")}
                    className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                  >
                    ← {t("moodComp.entry.title")}
                  </button>
                  <MoodSelector loading={loading} onSubmit={guardedRecommend} />
                </div>
              )}
            </div>
            <aside className="space-y-6">
              <PopularMoods onSelectMood={(m) => guardedRecommend({ mood: m as any })} />
              <MoodBadgesPanel badges={badges} context={{ ...badgeContext, reactionsCount }} />
            </aside>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-5 no-scrollbar">
              <TabsTrigger value="feed" className="shrink-0"><Sparkles className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Feed</span><span className="sm:hidden">Feed</span></TabsTrigger>
              <TabsTrigger value="map" className="shrink-0"><MapIcon className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Carte</span><span className="sm:hidden">Carte</span></TabsTrigger>
              <TabsTrigger value="favorites" className="shrink-0"><Heart className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Favoris</span><span className="sm:hidden">♥</span> ({favorites.length})</TabsTrigger>
              <TabsTrigger value="badges" className="shrink-0"><Trophy className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Badges</span><span className="sm:hidden">🏆</span> ({badges.length})</TabsTrigger>
              <TabsTrigger value="social" className="shrink-0"><Users className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Social</span><span className="sm:hidden">👥</span></TabsTrigger>
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
              <MoodFavorites favorites={favorites} onToggleFavorite={toggleFavorite} onOpenDetails={setDetailsPlace} />
            </TabsContent>

            <TabsContent value="badges" className="mt-4">
              <MoodBadgesPanel badges={badges} context={{ ...badgeContext, reactionsCount }} />
            </TabsContent>

            <TabsContent value="social" className="mt-4">
              <PopularMoods onSelectMood={(m) => { reset(); guardedRecommend({ mood: m as any }); }} />
            </TabsContent>
          </Tabs>
        )}

        {/* Historique en pied */}
        {history.length > 0 && !activeMood && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HistoryIcon className="w-4 h-4 text-primary" /> {t("moodComp.history.title")}
            </div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 6).map((h: any) => {
                const m = moodByKey(h.mood);
                return (
                  <button
                    key={h.id}
                    onClick={() => guardedRecommend({ mood: h.mood, free_input: h.free_input || undefined, energy_level: h.energy_level ?? undefined })}
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
              {t("moodComp.history.pickAnother")}
            </Button>
          </div>
        )}
      </div>

      <MoodPlaceDetail
        place={detailsPlace}
        isFavorite={detailsPlace ? isFavorite(detailsPlace.id) : false}
        onClose={() => setDetailsPlace(null)}
        onToggleFavorite={() => detailsPlace && toggleFavorite(detailsPlace)}
        onSharedReaction={() => user && getReactionsCount(user.id).then(setReactionsCount)}
      />
      <QuickJump />

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} toolName="Mood Explorer" />
    </div>
  );
};

export default MoodExplorer;
