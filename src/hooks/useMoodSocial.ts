import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { pingStreakAction } from "@/lib/streak";

export interface MoodReaction {
  id: string;
  user_id: string;
  place_id: string;
  mood: string;
  emoji: string | null;
  comment: string | null;
  lat: number | null;
  lng: number | null;
  place_name: string | null;
  created_at: string;
}

export interface PopularMood {
  mood: string;
  count: number;
}

export const moodReactionsQueryKey = (placeId: string | undefined) =>
  ["mood_reactions", placeId] as const;

export function useMoodReactions(placeId?: string) {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: moodReactionsQueryKey(placeId),
    enabled: !!placeId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("mood_reactions_public")
        .select("*")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false })
        .limit(50);
      return ((data as any) || []) as MoodReaction[];
    },
  });

  const reactions = data ?? [];

  // Realtime subscription — scoped to the current user's own channel.
  // Underlying mood_reactions RLS only emits the user's own row changes, so a
  // per-user topic is sufficient and prevents cross-user channel snooping.
  useEffect(() => {
    if (!placeId || !user?.id) return;
    const channel = supabase
      .channel(`mood_reactions:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mood_reactions", filter: `place_id=eq.${placeId}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [placeId, user?.id, refetch]);

  const addReaction = useCallback(
    async (input: { mood: string; emoji?: string; comment?: string; lat?: number | null; lng?: number | null; place_name?: string | null }) => {
      if (!user || !placeId) {
        toast.error("Connecte-toi pour partager ton ressenti");
        return null;
      }
      const { data, error } = await supabase
        .from("mood_reactions")
        .insert({
          user_id: user.id,
          place_id: placeId,
          mood: input.mood,
          emoji: input.emoji || null,
          comment: input.comment || null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          place_name: input.place_name ?? null,
        })
        .select("*")
        .single();
      if (error) {
        toast.error("Échec partage");
        return null;
      }
      toast.success("Ressenti partagé 💬");
      return data as any;
    },
    [user, placeId],
  );

  return { reactions, loading: placeId ? isLoading : false, addReaction, reload: refetch };
}

interface PopularMoodsData {
  popular: PopularMood[];
  recent: MoodReaction[];
}

export const popularMoodsQueryKey = ["popular_moods"] as const;

export function usePopularMoods() {
  const { data, isLoading, refetch } = useQuery<PopularMoodsData>({
    queryKey: popularMoodsQueryKey,
    queryFn: async () => {
      // Get recent reactions (last 7 days)
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase as any)
        .from("mood_reactions_public")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100);
      const list = ((data as any) || []) as MoodReaction[];
      const counts = new Map<string, number>();
      list.forEach((r) => counts.set(r.mood, (counts.get(r.mood) || 0) + 1));
      const popular = Array.from(counts.entries())
        .map(([mood, count]) => ({ mood, count }))
        .sort((a, b) => b.count - a.count);
      return { popular, recent: list.slice(0, 10) };
    },
  });

  return {
    popular: data?.popular ?? [],
    recent: data?.recent ?? [],
    loading: isLoading,
    reload: refetch,
  };
}

export async function getReactionsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("mood_reactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count || 0;
}
