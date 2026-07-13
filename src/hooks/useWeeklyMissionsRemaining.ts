// Lightweight hook returning how many of the 3 weekly missions are still pending.
// Used to badge the navbar entry. Reads counters from Supabase + local snapshot.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ensureWeeklySnapshot } from "@/lib/weekly-missions";

interface Counts { moodHiddenGems: number; exploreVisited: number; journalMoods: number; }

const EMPTY_COUNTS: Counts = { moodHiddenGems: 0, exploreVisited: 0, journalMoods: 0 };

export const weeklyMissionsQueryKey = (userId: string | undefined) =>
  ["weekly_missions_counts", userId] as const;

export function useWeeklyMissionsRemaining() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: weeklyMissionsQueryKey(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<Counts> => {
      const [nodes, blocks, favs] = await Promise.all([
        supabase.from("explore_nodes").select("status").eq("user_id", user!.id),
        supabase.from("journal_blocks").select("type").eq("user_id", user!.id),
        supabase.from("mood_favorites").select("place_id,mood_places!inner(hidden_gem)").eq("user_id", user!.id),
      ]);
      return {
        exploreVisited: (nodes.data || []).filter((n: any) => n.status === "visited").length,
        journalMoods: (blocks.data || []).filter((b: any) => b.type === "mood").length,
        moodHiddenGems: (favs.data || []).filter((f: any) => f.mood_places?.hidden_gem).length,
      };
    },
  });

  const counts = data ?? EMPTY_COUNTS;

  const baseline = useMemo(() => ensureWeeklySnapshot(counts as any).baseline, [user]);

  return useMemo(() => {
    const keys: Array<keyof Counts> = ["moodHiddenGems", "exploreVisited", "journalMoods"];
    const done = keys.filter((k) => Math.max(0, counts[k] - ((baseline?.[k] as number) ?? 0)) >= 1).length;
    return { done, total: keys.length, remaining: Math.max(0, keys.length - done) };
  }, [counts, baseline]);
}
