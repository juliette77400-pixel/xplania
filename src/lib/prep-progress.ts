// Per-trip preparation progress shown on the dashboard's four module cards.
// Every module keeps its own detailed state; this file only reads/writes a
// tiny summary so the dashboard never depends on itinerary or AI data.
import { findCountry } from "@/lib/country-match";

export type PrepModule = "budget" | "visa" | "valise" | "culture";

export interface ModuleProgress {
  done: number;
  total: number;
}

export interface TripRef {
  destination: string | null | undefined;
  departureDate?: string | null;
}

const SUMMARY_PREFIX = "xplania-prep";
const CULTURE_KEY = "xplania-culture-progress";
const BUDGET_PREFIX = "xplania-budget-state";
export const CULTURE_PILLAR_COUNT = 12;
export const PREP_PROGRESS_EVENT = "xplania:prep-progress";

const norm = (s: string | null | undefined) => (s || "").trim().toLowerCase();
const summaryKey = (module: PrepModule, destination: string | null | undefined) =>
  `${SUMMARY_PREFIX}::${module}::${norm(destination)}`;

const readJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

/** Saves a module's progress for one destination (called by Visa and Valise). */
export function saveModuleProgress(module: PrepModule, destination: string | null | undefined, progress: ModuleProgress) {
  if (!norm(destination)) return;
  try {
    localStorage.setItem(summaryKey(module, destination), JSON.stringify(progress));
    window.dispatchEvent(new Event(PREP_PROGRESS_EVENT));
  } catch {
    /* storage full or unavailable — progress is a convenience only */
  }
}

/** Budget: two steps — plan generated, first expense recorded. */
function budgetProgress(trip: TripRef): ModuleProgress {
  const state = readJson<{ hasGenerated?: boolean; expenses?: unknown[] }>(
    `${BUDGET_PREFIX}::${trip.destination || "Paris"}::${trip.departureDate || "na"}`,
  );
  const done = (state?.hasGenerated ? 1 : 0) + ((state?.expenses?.length ?? 0) > 0 ? 1 : 0);
  return { done, total: 2 };
}

/** Culture: pillars marked as understood for the destination country. */
function cultureProgress(trip: TripRef): ModuleProgress {
  const code = findCountry(trip.destination);
  const all = readJson<Record<string, boolean>>(CULTURE_KEY) || {};
  const done = code ? Object.entries(all).filter(([k, v]) => v && k.startsWith(`${code}:`)).length : 0;
  return { done: Math.min(done, CULTURE_PILLAR_COUNT), total: CULTURE_PILLAR_COUNT };
}

export function readTripProgress(trip: TripRef): Record<PrepModule, ModuleProgress> {
  const saved = (m: PrepModule) => readJson<ModuleProgress>(summaryKey(m, trip.destination)) ?? { done: 0, total: 0 };
  return {
    budget: budgetProgress(trip),
    visa: saved("visa"),
    valise: saved("valise"),
    culture: cultureProgress(trip),
  };
}

/** 0–100, counting a module without items yet as 0 %. */
export function overallPercent(progress: Record<PrepModule, ModuleProgress>): number {
  const parts = Object.values(progress).map((p) => (p.total > 0 ? Math.min(1, p.done / p.total) : 0));
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}
