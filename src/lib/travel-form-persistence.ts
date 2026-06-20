// Persistence helpers for the travel questionnaire.
// Saves progression (mode, step, formData) to localStorage so a crash, refresh
// or accidental close does not force the user to restart from question 1.
import type { TravelFormData } from "@/types/travel";
import type { PlanMode } from "@/components/xplania/form-steps/ModeSelector";

const STORAGE_KEY = "xplania.travel-form-progress.v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface TravelFormProgress {
  mode: PlanMode;
  step: number;
  formData: TravelFormData;
  savedAt: number;
}

export const loadTravelProgress = (): TravelFormProgress | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TravelFormProgress;
    if (!parsed?.formData || !parsed?.mode) return null;
    if (parsed.savedAt && Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveTravelProgress = (
  mode: PlanMode,
  step: number,
  formData: TravelFormData,
) => {
  try {
    const payload: TravelFormProgress = {
      mode,
      step,
      formData,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode — silently ignore */
  }
};

export const clearTravelProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Merges a (possibly stale) persisted formData with the current defaults,
 * guaranteeing every array/string/number field is present so consumers can
 * safely call `.includes()`, `.length`, arithmetic, etc. without crashing.
 */
export const safeMergeFormData = <T extends Record<string, unknown>>(
  defaults: T,
  partial: Partial<T> | null | undefined,
): T => {
  if (!partial) return { ...defaults };
  const result: any = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const def = (defaults as any)[key];
    const val = (partial as any)[key];
    if (val === undefined || val === null) continue;
    if (Array.isArray(def)) {
      result[key] = Array.isArray(val) ? val : def;
    } else if (typeof def === "number") {
      result[key] = typeof val === "number" && Number.isFinite(val) ? val : def;
    } else if (typeof def === "string") {
      result[key] = typeof val === "string" ? val : def;
    } else {
      result[key] = val;
    }
  }
  return result as T;
};
