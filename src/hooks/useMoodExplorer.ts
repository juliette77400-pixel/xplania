import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pingStreakAction } from "@/lib/streak";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { timeOfDay, type MoodKey } from "@/lib/moods";
import { invokeProtectedFunction } from "@/lib/protected-functions";
import { trackReaction } from "@/lib/user-memory";

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

export const moodFavoritesKey = (userId?: string) => ["mood", "favorites", userId] as const;
export const moodHistoryKey = (userId?: string) => ["mood", "history", userId] as const;
export const moodWeatherKey = (lat?: number, lng?: number) => ["mood", "weather", lat, lng] as const;

export function useMoodExplorer() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [places, setPlaces] = useState<MoodPlace[]>([]);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  const weatherQuery = useQuery({
    queryKey: moodWeatherKey(position?.lat, position?.lng),
    enabled: !!position,
    staleTime: 1000 * 60 * 15,
    queryFn: async () => {
      const { data } = await invokeProtectedFunction<{ conditions?: string; temperature?: string }>("weather", {
        body: { lat: position!.lat, lon: position!.lng },
      });
      return data?.conditions ? `${data.conditions} ${data.temperature || ""}`.trim() : null;
    },
  });
  const weather = weatherQuery.data ?? null;

  const favoritesQuery = useQuery({
    queryKey: moodFavoritesKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_favorites")
        .select("*, place:mood_places(*)")
        .eq("user_id", user!.id)
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return (data as MoodFavorite[]) || [];
    },
  });
  const favorites = useMemo<MoodFavorite[]>(() => favoritesQuery.data ?? [], [favoritesQuery.data]);

  const historyQuery = useQuery({
    queryKey: moodHistoryKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_selections")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });
  const history = historyQuery.data ?? [];

  const loadFavorites = useCallback(async () => {
    await favoritesQuery.refetch();
  }, [favoritesQuery]);

  const recommendMutation = useMutation({
    mutationFn: async (input: RecommendInput) => {
      if (!user) throw new Error("auth_required");
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
      return { data, input };
    },
    onSuccess: ({ data, input }) => {
      setPlaces(data?.places || []);
      setActiveMood(data?.mood || input.mood || null);
      qc.invalidateQueries({ queryKey: moodHistoryKey(user?.id) });
      if (!data?.places?.length) toast.info("Aucun lieu trouvé, réessaie avec un autre mood");
      else toast.success(`${data.places.length} lieux trouvés pour "${data.mood}"`);
    },
    onError: (e: any) => {
      if (e?.message === "auth_required") {
        toast.error("Connecte-toi pour utiliser le Mood Explorer");
      } else {
        toast.error(e?.message || "Erreur recommandation");
      }
    },
  });

  const recommend = useCallback(
    async (input: RecommendInput) => {
      await recommendMutation.mutateAsync(input).catch(() => {});
    },
    [recommendMutation],
  );

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (place: MoodPlace) => {
      if (!user) throw new Error("auth_required");
      const existing = favorites.find((f) => f.place_id === place.id);
      if (existing) {
        const { error } = await supabase.from("mood_favorites").delete().eq("id", existing.id);
        if (error) throw error;
        return { kind: "removed" as const, id: existing.id };
      }
      const { data, error } = await supabase
        .from("mood_favorites")
        .insert({ user_id: user.id, place_id: place.id })
        .select("*, place:mood_places(*)")
        .single();
      if (error) throw error;
      return { kind: "added" as const, favorite: data as MoodFavorite };
    },
    onSuccess: (res, place) => {
      qc.setQueryData<MoodFavorite[]>(moodFavoritesKey(user?.id), (prev) => {
        const list = prev ?? [];
        if (res.kind === "removed") return list.filter((f) => f.id !== res.id);
        return [res.favorite, ...list];
      });
      if (res.kind === "added") {
        pingStreakAction("mood:favorite");
        toast.success("Sauvegardé ❤️");
        void trackReaction({
          itemKey: place.name,
          itemType: "mood_place",
          source: "mood-explorer",
          liked: true,
          tags: place.tags ?? [],
          context: { mood: place.mood, category: place.category },
        });
      } else {
        toast.success("Retiré des favoris");
      }
    },
    onError: (e: any) => {
      toast.error(e?.message === "auth_required" ? "Connecte-toi" : "Échec sauvegarde");
    },
  });

  const toggleFavorite = useCallback(
    async (place: MoodPlace) => {
      await toggleFavoriteMutation.mutateAsync(place).catch(() => {});
    },
    [toggleFavoriteMutation],
  );

  const isFavorite = useCallback(
    (placeId: string) => favorites.some((f) => f.place_id === placeId),
    [favorites],
  );

  const reset = useCallback(() => {
    setPlaces([]);
    setActiveMood(null);
  }, []);

  const distinctMoods = new Set(history.map((h: any) => h.mood)).size;
  const hiddenGemsSaved = favorites.filter((f) => f.place?.hidden_gem).length;
  const badgeContext = {
    distinctMoods,
    favoritesCount: favorites.length,
    hiddenGemsSaved,
    totalSelections: history.length,
    reactionsCount: 0,
  };

  return {
    places,
    favorites,
    history,
    loading: recommendMutation.isPending,
    activeMood,
    position,
    weather,
    recommend,
    toggleFavorite,
    isFavorite,
    reset,
    loadFavorites,
    badgeContext,
  };
}
