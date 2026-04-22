import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { timeOfDay, type MoodKey } from "@/lib/moods";

export interface MoodPlace {
  id: string;
  user_id: string;
  selection_id: string | null;
  mood: string;
  name: string;
  category: string | null;
  description: string | null;
  why_fits: string;
  tags: string[];
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  distance_km: number | null;
  duration_min: number | null;
  tips: string | null;
  hidden_gem: boolean;
  score: number;
  source: string;
  metadata: any;
  created_at: string;
}

export interface MoodFavorite {
  id: string;
  user_id: string;
  place_id: string;
  trip_id: string | null;
  note: string | null;
  saved_at: string;
  place?: MoodPlace;
}

export interface RecommendInput {
  mood?: MoodKey | string;
  free_input?: string;
  energy_level?: number;
  surprise?: boolean;
  city_hint?: string;
}

export function useMoodExplorer() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<MoodPlace[]>([]);
  const [favorites, setFavorites] = useState<MoodFavorite[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<string | null>(null);

  // Geolocate once on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  // Fetch weather when position known
  useEffect(() => {
    if (!position) return;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("weather", {
          body: { lat: position.lat, lon: position.lng },
        });
        if (data?.conditions) setWeather(`${data.conditions} ${data.temperature || ""}`.trim());
      } catch {}
    })();
  }, [position]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("mood_favorites")
      .select("*, place:mood_places(*)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setFavorites((data as any) || []);
  }, [user]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mood_selections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data || []);
  }, [user]);

  useEffect(() => {
    loadFavorites();
    loadHistory();
  }, [loadFavorites, loadHistory]);

  const recommend = useCallback(async (input: RecommendInput) => {
    if (!user) {
      toast.error("Connecte-toi pour utiliser le Mood Explorer");
      return;
    }
    setLoading(true);
    try {
      const locale = (localStorage.getItem("xplania-lang") || navigator.language).startsWith("en") ? "en" : "fr";
      const { data, error } = await supabase.functions.invoke("mood-recommend", {
        body: {
          ...input,
          lat: position?.lat,
          lng: position?.lng,
          weather: weather || undefined,
          time_of_day: timeOfDay(),
          locale,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlaces(data?.places || []);
      setActiveMood(data?.mood || input.mood || null);
      loadHistory();
      if (!data?.places?.length) toast.info("Aucun lieu trouvé, réessaie avec un autre mood");
      else toast.success(`${data.places.length} lieux trouvés pour "${data.mood}"`);
    } catch (e: any) {
      toast.error(e?.message || "Erreur recommandation");
    } finally {
      setLoading(false);
    }
  }, [user, position, weather, loadHistory]);

  const toggleFavorite = useCallback(async (place: MoodPlace) => {
    if (!user) return;
    const existing = favorites.find((f) => f.place_id === place.id);
    if (existing) {
      const { error } = await supabase.from("mood_favorites").delete().eq("id", existing.id);
      if (error) {
        toast.error("Échec suppression");
        return;
      }
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      toast.success("Retiré des favoris");
    } else {
      const { data, error } = await supabase
        .from("mood_favorites")
        .insert({ user_id: user.id, place_id: place.id })
        .select("*, place:mood_places(*)")
        .single();
      if (error) {
        toast.error("Échec sauvegarde");
        return;
      }
      setFavorites((prev) => [data as any, ...prev]);
      pingStreakAction("mood:favorite"); // ✨ NEW (gamif)
      toast.success("Sauvegardé ❤️");
    }
  }, [user, favorites]);

  const isFavorite = useCallback(
    (placeId: string) => favorites.some((f) => f.place_id === placeId),
    [favorites],
  );

  const reset = useCallback(() => {
    setPlaces([]);
    setActiveMood(null);
  }, []);

  // Compute badge context (distinct moods, hidden gems saved, etc.)
  const distinctMoods = new Set(history.map((h: any) => h.mood)).size;
  const hiddenGemsSaved = favorites.filter((f) => f.place?.hidden_gem).length;
  const badgeContext = {
    distinctMoods,
    favoritesCount: favorites.length,
    hiddenGemsSaved,
    totalSelections: history.length,
    reactionsCount: 0, // hydraté côté page
  };

  return {
    places, favorites, history, loading, activeMood, position, weather,
    recommend, toggleFavorite, isFavorite, reset, loadFavorites,
    badgeContext,
  };
}
