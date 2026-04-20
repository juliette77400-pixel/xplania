import { differenceInDays, addDays, format, parseISO } from "date-fns";

export const buildDateRange = (start?: string | null, end?: string | null): string[] => {
  if (!start) return [];
  const startDate = parseISO(start);
  const endDate = end ? parseISO(end) : startDate;
  const days = Math.max(1, differenceInDays(endDate, startDate) + 1);
  return Array.from({ length: days }, (_, i) => format(addDays(startDate, i), "yyyy-MM-dd"));
};

export const formatDayLabel = (iso: string) => {
  try {
    return format(parseISO(iso), "EEEE d MMMM");
  } catch {
    return iso;
  }
};

export const BLOCK_LABELS: Record<string, { emoji: string; label: string }> = {
  note: { emoji: "📝", label: "Note" },
  photo: { emoji: "📸", label: "Photo" },
  video: { emoji: "🎥", label: "Vidéo" },
  location: { emoji: "📍", label: "Lieu" },
  mood: { emoji: "😊", label: "Humeur" },
  audio: { emoji: "🎧", label: "Audio" },
  highlight: { emoji: "⭐", label: "Moment fort" },
};

export const TONES = [
  { value: "storytelling", label: "Storytelling", desc: "Récit narratif et engageant" },
  { value: "poetic", label: "Poétique", desc: "Style lyrique et imagé" },
  { value: "fun", label: "Fun & léger", desc: "Ton décontracté et humoristique" },
  { value: "documentary", label: "Documentaire", desc: "Style factuel et descriptif" },
];

export const BADGES = {
  explorer: { code: "explorer", label: "🌍 Explorateur", trigger: "3 lieux visités" },
  storyteller: { code: "storyteller", label: "✍️ Storyteller", trigger: "5 notes écrites" },
  photographer: { code: "photographer", label: "📸 Photographe", trigger: "10 photos ajoutées" },
  emotional: { code: "emotional", label: "💖 Émotionnel", trigger: "5 humeurs partagées" },
  highlight: { code: "highlight", label: "⭐ Curateur", trigger: "3 moments forts" },
};
