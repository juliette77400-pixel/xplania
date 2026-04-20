import { useState } from "react";
import { Sparkles, Heart, History as HistoryIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMoodExplorer } from "@/hooks/useMoodExplorer";
import MoodHero from "@/components/mood/MoodHero";
import MoodSelector from "@/components/mood/MoodSelector";
import MoodFeed from "@/components/mood/MoodFeed";
import MoodFavorites from "@/components/mood/MoodFavorites";
import { moodByKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";

const MoodExplorer = () => {
  const {
    places, favorites, history, loading, activeMood, position, weather,
    recommend, toggleFavorite, isFavorite, reset,
  } = useMoodExplorer();

  const [tab, setTab] = useState("feed");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <MoodHero activeMood={activeMood} weather={weather} position={position} onReset={() => { reset(); setTab("feed"); }} />

        {!activeMood || places.length === 0 ? (
          <MoodSelector loading={loading} onSubmit={recommend} />
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="feed"><Sparkles className="w-4 h-4 mr-1" /> Feed</TabsTrigger>
              <TabsTrigger value="favorites"><Heart className="w-4 h-4 mr-1" /> Favoris ({favorites.length})</TabsTrigger>
              <TabsTrigger value="history"><HistoryIcon className="w-4 h-4 mr-1" /> Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-4">
              <MoodFeed places={places} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              <MoodFavorites favorites={favorites} onToggleFavorite={toggleFavorite} />
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun historique.</p>
              ) : (
                history.map((h) => {
                  const m = moodByKey(h.mood);
                  return (
                    <button
                      key={h.id}
                      onClick={() => recommend({ mood: h.mood, free_input: h.free_input || undefined, energy_level: h.energy_level ?? undefined })}
                      className="w-full text-left rounded-xl border border-border bg-card/40 backdrop-blur-sm p-3 hover:border-primary/40 transition-colors flex items-center gap-3"
                    >
                      <span className="text-2xl">{m?.emoji || "✨"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{m?.label || h.mood}</div>
                        {h.free_input && <div className="text-xs text-muted-foreground truncate">"{h.free_input}"</div>}
                        <div className="text-[11px] text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}

        {activeMood && places.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="sm" onClick={() => { reset(); setTab("feed"); }}>
              ← Choisir un autre mood
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodExplorer;
