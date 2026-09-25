// Lightweight hook returning how many of the 3 weekly missions are still pending.
// Used to badge the navbar entry. Once the user opens "Badges et progression",
// the badge is hidden for the rest of the week (until the count goes up again).
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useWeeklyProgress } from "@/lib/data/weekly-progress";

const SEEN_KEY = "xplania-missions-seen";

const weekKey = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
};

const readSeen = (): { week: string; count: number } | null => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "null");
  } catch {
    return null;
  }
};

export function useWeeklyMissionsRemaining() {
  const { counts, baseline } = useWeeklyProgress();
  const { pathname } = useLocation();
  const [seen, setSeen] = useState(readSeen);

  const base = useMemo(() => {
    const keys = ["moodHiddenGems", "exploreVisited", "journalMoods"] as const;
    const done = keys.filter(
      (k) => Math.max(0, counts[k] - ((baseline?.[k] as number) ?? 0)) >= 1,
    ).length;
    return { done, total: keys.length, remaining: Math.max(0, keys.length - done) };
  }, [counts, baseline]);

  useEffect(() => {
    if (pathname.startsWith("/gamification")) {
      const v = { week: weekKey(), count: base.remaining };
      localStorage.setItem(SEEN_KEY, JSON.stringify(v));
      setSeen(v);
    }
  }, [pathname, base.remaining]);

  const hidden = !!seen && seen.week === weekKey() && base.remaining <= seen.count;
  return { ...base, remaining: hidden ? 0 : base.remaining };
}
