import type { MoodKey } from "./moods";
import i18n from "@/i18n";

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
    get description() { return i18n.t("ui2.MoodBadges.moodCurious"); },
    icon: "🧠",
    check: (c) => c.distinctMoods >= 3,
  },
  {
    code: "hidden_hunter",
    name: "Hidden Hunter",
    get description() { return i18n.t("ui2.MoodBadges.hiddenHunter"); },
    icon: "💎",
    check: (c) => c.hiddenGemsSaved >= 1,
  },
  {
    code: "mood_master",
    name: "Mood Master",
    get description() { return i18n.t("ui2.MoodBadges.moodMaster"); },
    icon: "👑",
    check: (c) => c.distinctMoods >= 7,
  },
  {
    code: "collector",
    name: "Collector",
    get description() { return i18n.t("ui2.MoodBadges.collector"); },
    icon: "📚",
    check: (c) => c.favoritesCount >= 10,
  },
  {
    code: "social_soul",
    name: "Social Soul",
    get description() { return i18n.t("ui2.MoodBadges.socialSoul"); },
    icon: "💬",
    check: (c) => c.reactionsCount >= 1,
  },
];

// Audio ambience par mood (URLs publiques CDN libres de droits)
export const MOOD_AMBIENCE: Record<MoodKey, { readonly label: string; url: string }> = {
  chill:    { get label() { return i18n.t("ui2.MoodBadges.ambience.chill"); },    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" },
  explore:  { get label() { return i18n.t("ui2.MoodBadges.ambience.explore"); },  url: "https://cdn.pixabay.com/audio/2022/10/30/audio_347111d654.mp3" },
  romantic: { get label() { return i18n.t("ui2.MoodBadges.ambience.romantic"); }, url: "https://cdn.pixabay.com/audio/2022/03/15/audio_2c5b0d1f61.mp3" },
  food:     { get label() { return i18n.t("ui2.MoodBadges.ambience.food"); },     url: "https://cdn.pixabay.com/audio/2022/08/03/audio_2dde668ca0.mp3" },
  party:    { get label() { return i18n.t("ui2.MoodBadges.ambience.party"); },    url: "https://cdn.pixabay.com/audio/2022/10/25/audio_31c8a06e32.mp3" },
  nature:   { get label() { return i18n.t("ui2.MoodBadges.ambience.nature"); },   url: "https://cdn.pixabay.com/audio/2022/03/10/audio_270f49b83f.mp3" },
  focus:    { get label() { return i18n.t("ui2.MoodBadges.ambience.focus"); },    url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1bdd.mp3" },
};
