import { differenceInDays, addDays, format, parseISO } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import i18n from "@/i18n";

export const buildDateRange = (start?: string | null, end?: string | null): string[] => {
  if (!start) return [];
  const startDate = parseISO(start);
  const endDate = end ? parseISO(end) : startDate;
  const days = Math.max(1, differenceInDays(endDate, startDate) + 1);
  return Array.from({ length: days }, (_, i) => format(addDays(startDate, i), "yyyy-MM-dd"));
};

export const formatDayLabel = (iso: string) => {
  try {
    const locale = i18n.language?.startsWith("fr") ? fr : enUS;
    return format(parseISO(iso), "EEEE d MMMM", { locale });
  } catch {
    return iso;
  }
};

export const BLOCK_LABELS: Record<string, { emoji: string; readonly label: string }> = {
  note: { emoji: "📝", get label() { return i18n.t("ui2.journalUtils.block_note"); } },
  photo: { emoji: "📸", get label() { return i18n.t("ui2.journalUtils.block_photo"); } },
  video: { emoji: "🎥", get label() { return i18n.t("ui2.journalUtils.block_video"); } },
  location: { emoji: "📍", get label() { return i18n.t("ui2.journalUtils.block_location"); } },
  mood: { emoji: "😊", get label() { return i18n.t("ui2.journalUtils.block_mood"); } },
  audio: { emoji: "🎧", get label() { return i18n.t("ui2.journalUtils.block_audio"); } },
  highlight: { emoji: "⭐", get label() { return i18n.t("ui2.journalUtils.block_highlight"); } },
};

export const TONES = [
  { value: "storytelling", get label() { return i18n.t("ui2.journalUtils.tone_storytelling_label"); }, get desc() { return i18n.t("ui2.journalUtils.tone_storytelling_desc"); } },
  { value: "poetic", get label() { return i18n.t("ui2.journalUtils.tone_poetic_label"); }, get desc() { return i18n.t("ui2.journalUtils.tone_poetic_desc"); } },
  { value: "fun", get label() { return i18n.t("ui2.journalUtils.tone_fun_label"); }, get desc() { return i18n.t("ui2.journalUtils.tone_fun_desc"); } },
  { value: "documentary", get label() { return i18n.t("ui2.journalUtils.tone_documentary_label"); }, get desc() { return i18n.t("ui2.journalUtils.tone_documentary_desc"); } },
];

export const BADGES = {
  explorer: { code: "explorer", get label() { return i18n.t("ui2.journalUtils.badge_explorer_label"); }, get trigger() { return i18n.t("ui2.journalUtils.badge_explorer_trigger"); } },
  storyteller: { code: "storyteller", get label() { return i18n.t("ui2.journalUtils.badge_storyteller_label"); }, get trigger() { return i18n.t("ui2.journalUtils.badge_storyteller_trigger"); } },
  photographer: { code: "photographer", get label() { return i18n.t("ui2.journalUtils.badge_photographer_label"); }, get trigger() { return i18n.t("ui2.journalUtils.badge_photographer_trigger"); } },
  emotional: { code: "emotional", get label() { return i18n.t("ui2.journalUtils.badge_emotional_label"); }, get trigger() { return i18n.t("ui2.journalUtils.badge_emotional_trigger"); } },
  highlight: { code: "highlight", get label() { return i18n.t("ui2.journalUtils.badge_highlight_label"); }, get trigger() { return i18n.t("ui2.journalUtils.badge_highlight_trigger"); } },
};
