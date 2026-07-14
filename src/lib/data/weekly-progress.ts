// Shared weekly-missions progress source. Previously duplicated across
// `WeeklyMissionsCard`, `MissionsBanner`, and `useWeeklyMissionsRemaining` —
// three identical 3-way Supabase fetches. Now a single React Query source of
// truth so components share the cache and can't drift.
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ensureWeeklySnapshot } from "@/lib/weekly-missions";

export interface WeeklyProgressCounts {
  moodHiddenGems: number;
  exploreVisited: number;
  journalMoods: number;
}

export const EMPTY_WEEKLY_COUNTS: WeeklyProgressCounts = {
  moodHiddenGems: 0,
  exploreVisited: 0,
  journalMoods: 0,
};

export const weeklyProgressQueryKey = (userId: string | undefined) =>
  ["weekly_progress", userId] as const;

export async function fetchWeeklyProgressCounts(userId: string): Promise<WeeklyProgressCounts> {
  const [nodes, blocks, favs] = await Promise.all([
    supabase.from("explore_nodes").select("status").eq("user_id", userId),
    supabase.from("journal_blocks").select("type").eq("user_id", userId),
    supabase
      .from("mood_favorites")
      .select("place_id,mood_places!inner(hidden_gem)")
      .eq("user_id", userId),
  ]);
  return {
    exploreVisited: (nodes.data || []).filter((n: any) => n.status === "visited").length,
    journalMoods: (blocks.data || []).filter((b: any) => b.type === "mood").length,
    moodHiddenGems: (favs.data || []).filter((f: any) => f.mood_places?.hidden_gem).length,
  };
}

/**
 * React Query source of truth for the weekly missions counters and the
 * baseline snapshot for the current ISO week. All UI surfaces (banner, card,
 * navbar badge) should read from here.
 */
export function useWeeklyProgress() {
  const { user } = useAuth();
  const { data: counts = EMPTY_WEEKLY_COUNTS, isLoading } = useQuery({
    queryKey: weeklyProgressQueryKey(user?.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    queryFn: () => fetchWeeklyProgressCounts(user!.id),
  });

  // Snapshot is derived from counts; keeping it here co-locates read + baseline.
  const baseline = ensureWeeklySnapshot(counts as any).baseline;

  return { counts, baseline, loading: !!user && isLoading };
}
