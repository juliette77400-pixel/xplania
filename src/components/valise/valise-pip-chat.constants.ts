// Data, storage helpers and pure utilities used by ValisePipChat.
// Extracted so the main component file stays focused on UI/state.

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
  pending?: boolean;
  tempId?: string;
}

export type Stage =
  | "welcome"
  | "destination"
  | "dates"
  | "luggage"
  | "tripType"
  | "activities"
  | "duration"
  | "summary"
  | "qa";

export const STORAGE_KEY = "xplania-valise-pip-v1";
export const SEEN_KEY = "xplania-valise-pip-seen-v1";
export const QUEUE_KEY = "xplania-valise-pip-queue-v1";
export const CHAT_KIND = "valise";

export interface QueuedAsk {
  tempId: string;
  question: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

export function readQueue(): QueuedAsk[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeQueue(q: QueuedAsk[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* */ }
}

export interface PersistedState {
  history: ChatMsg[];
  stage: Stage;
  ctx: {
    dest: string;
    start: string;
    end: string;
    luggage: string;
    trip: string;
    activities: string[];
    duration: string;
  };
  updatedAt: number;
}

export function readLocalState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || !Array.isArray(parsed.history)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalState(state: PersistedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* */ }
}

export const LUGGAGES = [
  { key: "backpack", emoji: "🎒" },
  { key: "cabin", emoji: "🧳" },
  { key: "large", emoji: "🧳" },
  { key: "sport", emoji: "👜" },
  { key: "both", emoji: "🎒🧳" },
] as const;

export const TRIP_TYPES = [
  { key: "beach", emoji: "🏖️" },
  { key: "mountain", emoji: "🏔️" },
  { key: "city", emoji: "🏙️" },
  { key: "nature", emoji: "🌿" },
  { key: "business", emoji: "💼" },
  { key: "long", emoji: "🎓" },
  { key: "solo", emoji: "🚶‍♀️" },
  { key: "couple", emoji: "👩‍❤️‍👨" },
  { key: "family", emoji: "👨‍👩‍👧" },
] as const;

export const ACTIVITIES = [
  { key: "swim", emoji: "🏊" },
  { key: "hike", emoji: "🥾" },
  { key: "food", emoji: "🍽️" },
  { key: "culture", emoji: "🏛️" },
  { key: "nightlife", emoji: "🎉" },
  { key: "sport", emoji: "🏋️" },
  { key: "photo", emoji: "📸" },
  { key: "remote", emoji: "💻" },
] as const;

export const DURATIONS = ["lt3d", "3to7d", "1to2w", "2to4w", "gt1m"] as const;

export function daysBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : null;
}
