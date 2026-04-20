import type { MoodKey } from "./moods";

export interface MoodBadgeDef {
  code: string;
  name: string;
  description: string;
  icon: string; // emoji
  check: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  distinctMoods: number; // # de moods distincts testés
  favoritesCount: number;
  hiddenGemsSaved: number;
  totalSelections: number;
  reactionsCount: number;
}

export const MOOD_BADGES: MoodBadgeDef[] = [
  {
    code: "mood_curious",
    name: "Mood Curious",
    description: "Tester 3 moods différents",
    icon: "🧠",
    check: (c) => c.distinctMoods >= 3,
  },
  {
    code: "hidden_hunter",
    name: "Hidden Hunter",
    description: "Sauvegarder un hidden gem",
    icon: "💎",
    check: (c) => c.hiddenGemsSaved >= 1,
  },
  {
    code: "mood_master",
    name: "Mood Master",
    description: "Tester les 7 moods",
    icon: "👑",
    check: (c) => c.distinctMoods >= 7,
  },
  {
    code: "collector",
    name: "Collector",
    description: "10 lieux en favoris",
    icon: "📚",
    check: (c) => c.favoritesCount >= 10,
  },
  {
    code: "social_soul",
    name: "Social Soul",
    description: "Partager un ressenti public",
    icon: "💬",
    check: (c) => c.reactionsCount >= 1,
  },
];

// Audio ambience par mood (URLs publiques CDN libres de droits)
export const MOOD_AMBIENCE: Record<MoodKey, { label: string; url: string }> = {
  chill:    { label: "Lo-fi calme",   url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" },
  explore:  { label: "Folk aventure", url: "https://cdn.pixabay.com/audio/2022/10/30/audio_347111d654.mp3" },
  romantic: { label: "Jazz tendre",   url: "https://cdn.pixabay.com/audio/2022/03/15/audio_2c5b0d1f61.mp3" },
  food:     { label: "Bossa gourmet", url: "https://cdn.pixabay.com/audio/2022/08/03/audio_2dde668ca0.mp3" },
  party:    { label: "Electro vibes", url: "https://cdn.pixabay.com/audio/2022/10/25/audio_31c8a06e32.mp3" },
  nature:   { label: "Ambient nature",url: "https://cdn.pixabay.com/audio/2022/03/10/audio_270f49b83f.mp3" },
  focus:    { label: "Lo-fi focus",   url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1bdd.mp3" },
};
