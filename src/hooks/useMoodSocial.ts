import { useCallback, useEffect, useState } from "react";
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

export function useMoodReactions(placeId?: string) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<MoodReaction[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("mood_reactions_public")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false })
      .limit(50);
    setReactions((data as any) || []);
    setLoading(false);
  }, [placeId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!placeId) return;
    const channel = supabase
      .channel(`mood_reactions:${placeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mood_reactions", filter: `place_id=eq.${placeId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [placeId, load]);

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

  return { reactions, loading, addReaction, reload: load };
}

export function usePopularMoods() {
  const [popular, setPopular] = useState<PopularMood[]>([]);
  const [recent, setRecent] = useState<MoodReaction[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Get recent reactions (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("mood_reactions")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100);
    const list = (data as any) || [];
    setRecent(list.slice(0, 10));
    const counts = new Map<string, number>();
    list.forEach((r: MoodReaction) => counts.set(r.mood, (counts.get(r.mood) || 0) + 1));
    const popular = Array.from(counts.entries())
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);
    setPopular(popular);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { popular, recent, loading, reload: load };
}

export async function getReactionsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("mood_reactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count || 0;
}
