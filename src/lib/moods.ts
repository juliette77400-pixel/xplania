export type MoodKey =
  | "chill"
  | "explore"
  | "romantic"
  | "food"
  | "party"
  | "nature"
  | "focus";

export interface MoodDef {
  key: MoodKey;
  label: string;
  emoji: string;
  description: string;
  gradient: string; // tailwind gradient classes
  glow: string; // tailwind text/shadow
}

export const MOODS: MoodDef[] = [
  { key: "chill",    label: "Chill",     emoji: "🌿", description: "Calme, vue, slow vibes",       gradient: "from-cyan-500/30 to-emerald-400/20",   glow: "text-cyan-300" },
  { key: "explore",  label: "Explore",   emoji: "🧭", description: "Aventure, hidden gems",         gradient: "from-amber-500/30 to-orange-400/20",   glow: "text-amber-300" },
  { key: "romantic", label: "Romantic",  emoji: "💞", description: "Sunset, intime, élégant",       gradient: "from-rose-500/30 to-pink-400/20",      glow: "text-rose-300" },
  { key: "food",     label: "Food",      emoji: "🍜", description: "Saveurs locales, gourmand",     gradient: "from-orange-500/30 to-red-400/20",     glow: "text-orange-300" },
  { key: "party",    label: "Party",     emoji: "🪩", description: "Énergie, rooftop, nightlife",   gradient: "from-fuchsia-500/30 to-purple-400/20", glow: "text-fuchsia-300" },
  { key: "nature",   label: "Nature",    emoji: "🌄", description: "Recharger, plein air",          gradient: "from-emerald-500/30 to-teal-400/20",   glow: "text-emerald-300" },
  { key: "focus",    label: "Focus",     emoji: "☕", description: "Bosser, concentration, café",   gradient: "from-slate-500/30 to-blue-400/20",     glow: "text-blue-300" },
];

export const moodByKey = (k: string) => MOODS.find((m) => m.key === k);

export function timeOfDay(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 6) return "night";
  if (h < 11) return "morning";
  if (h < 14) return "noon";
  if (h < 18) return "afternoon";
  if (h < 22) return "evening";
  return "night";
}
