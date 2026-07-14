// Lightweight hook returning how many of the 3 weekly missions are still pending.
// Used to badge the navbar entry. Reads counters from the shared data layer.
import { useMemo } from "react";
import { useWeeklyProgress } from "@/lib/data/weekly-progress";

export function useWeeklyMissionsRemaining() {
  const { counts, baseline } = useWeeklyProgress();

  return useMemo(() => {
    const keys = ["moodHiddenGems", "exploreVisited", "journalMoods"] as const;
    const done = keys.filter(
      (k) => Math.max(0, counts[k] - ((baseline?.[k] as number) ?? 0)) >= 1,
    ).length;
    return { done, total: keys.length, remaining: Math.max(0, keys.length - done) };
  }, [counts, baseline]);
}
