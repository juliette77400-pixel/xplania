// XP & Level system — Xplania Gamification
// 7 paliers: Explorateur novice → Légende

export interface Level {
  index: number;
  name: string;
  emoji: string;
  minXp: number;
  /** gradient tailwind classes for badge/header */
  gradient: string;
}

export const LEVELS: Level[] = [
  { index: 0, name: "Explorateur novice", emoji: "🌱", minXp: 0,    gradient: "from-slate-400 to-slate-500" },
  { index: 1, name: "Voyageur",            emoji: "🧭", minXp: 200,  gradient: "from-cyan-400 to-blue-500" },
  { index: 2, name: "Aventurier",          emoji: "🏔️", minXp: 600,  gradient: "from-emerald-400 to-teal-500" },
  { index: 3, name: "Globe-trotter",       emoji: "🌍", minXp: 1200, gradient: "from-violet-400 to-purple-500" },
  { index: 4, name: "Pathfinder",          emoji: "⚡", minXp: 2200, gradient: "from-fuchsia-400 to-pink-500" },
  { index: 5, name: "Maître voyageur",     emoji: "👑", minXp: 3800, gradient: "from-amber-400 to-orange-500" },
  { index: 6, name: "Légende",             emoji: "🏆", minXp: 6000, gradient: "from-yellow-300 via-amber-400 to-orange-500" },
];

export interface LevelProgress {
  level: Level;
  next: Level | null;
  xp: number;
  xpInLevel: number;
  xpForNext: number;
  pct: number;
}

export function getLevelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (safeXp >= l.minXp) current = l;
  }
  const next = LEVELS[current.index + 1] || null;
  if (!next) {
    return { level: current, next: null, xp: safeXp, xpInLevel: safeXp - current.minXp, xpForNext: 0, pct: 100 };
  }
  const span = next.minXp - current.minXp;
  const xpInLevel = safeXp - current.minXp;
  const pct = Math.min(100, Math.round((xpInLevel / span) * 100));
  return { level: current, next, xp: safeXp, xpInLevel, xpForNext: span - xpInLevel, pct };
}

/**
 * Compute total XP from real activity counts.
 * Tuned so an active beta user can reach "Voyageur" within a short trip.
 */
export interface XpInputs {
  exploreVisited: number;
  journalNotes: number;
  journalPhotos: number;
  journalLocations: number;
  journalMoods: number;
  moodFavorites: number;
  moodHiddenGems: number;
  badgesTotal: number;
  /** ✨ NEW — contributions communautaires (avis sur lieux Discover) */
  placeReviews?: number;
  /** ✨ NEW — réactions mood publiées (commentaires + emoji sur un lieu) */
  moodReactions?: number;
}

export function computeXp(i: XpInputs): number {
  return (
    i.exploreVisited * 20 +
    i.journalNotes * 10 +
    i.journalPhotos * 15 +     // ✨ MODIFIED — boost contribution photo (8 → 15)
    i.journalLocations * 12 +
    i.journalMoods * 15 +
    i.moodFavorites * 10 +
    i.moodHiddenGems * 25 +
    i.badgesTotal * 50 +
    (i.placeReviews ?? 0) * 25 +   // ✨ NEW — avis Discover
    (i.moodReactions ?? 0) * 12    // ✨ NEW — réactions mood
  );
}
