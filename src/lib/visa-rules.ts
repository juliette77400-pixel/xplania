// Visa guide rules: the student profile read from the trip, which answers are
// still missing, the fixed EU free-movement rule, health relevance and the
// saved analysis/checklist. Pure functions so they can be tested.
import { countryList } from "@/lib/countries";
import { findCountry } from "@/lib/country-match";
import { BUCKET_DAYS } from "@/lib/prep-quiz";
import type { TravelFormData } from "@/types/travel";

// Keep in sync with supabase/functions/_shared/visa-rules.ts.
// EU + EEA (Iceland, Liechtenstein, Norway) + Switzerland.
export const FREE_MOVEMENT = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "CH",
]);

export function hasFreeMovement(destination: string, nationalities: Array<string | null | undefined>): boolean {
  const d = (destination || "").toUpperCase();
  if (!FREE_MOVEMENT.has(d)) return false;
  return nationalities.some((n) => !!n && FREE_MOVEMENT.has(n.toUpperCase()));
}

export const PASSPORT_TYPES = ["ordinary", "other"] as const;
export type PassportType = (typeof PASSPORT_TYPES)[number];

export interface VisaProfile {
  destinationCode: string;
  city: string;
  nationality: string;
  secondNationality: string;
  residence: string;
  stayType: string;
  departureDate: string;
  returnDate: string;
  durationBucket: string;
  passportType: PassportType | "";
  /** "yes" | "no" | "" (not answered) */
  hasTransit: "yes" | "no" | "";
  transitCountries: string[];
  regions: string;
}

export type VisaField = "destination" | "nationality" | "residence" | "stayType" | "duration" | "passportType" | "transit";

export const countryLabel = (code: string | null | undefined) =>
  (code && countryList.find((c) => c.code === code)?.name) || "";

export function visaProfileFromTrip(form: Partial<TravelFormData> | null | undefined, fallbackDestination?: string | null): VisaProfile {
  const f = form || {};
  const dest = f.destination || fallbackDestination || "";
  const transit = Array.isArray(f.transitCountries) ? f.transitCountries.filter((c) => typeof c === "string" && c) : [];
  return {
    destinationCode: findCountry(dest) || "",
    city: f.arrivalCity && f.arrivalCity !== dest ? f.arrivalCity : "",
    nationality: f.nationality || "",
    secondNationality: f.secondNationality || "",
    residence: f.residence || "",
    stayType: f.stayType || "",
    departureDate: f.departureDate || "",
    returnDate: f.returnDate || "",
    durationBucket: f.durationBucket || "",
    passportType: f.passportType === "ordinary" || f.passportType === "other" ? f.passportType : "",
    hasTransit: f.hasTransit === "yes" || f.hasTransit === "no" ? f.hasTransit : transit.length ? "yes" : "",
    transitCountries: transit,
    regions: f.visitedRegions || "",
  };
}

/** Number of days of the stay, 0 when unknown. */
export function visaStayDays(p: Pick<VisaProfile, "departureDate" | "returnDate" | "durationBucket">): number {
  if (p.departureDate && p.returnDate && p.returnDate >= p.departureDate) {
    return Math.max(1, Math.round((new Date(p.returnDate).getTime() - new Date(p.departureDate).getTime()) / 86_400_000) + 1);
  }
  if (p.durationBucket && p.durationBucket in BUCKET_DAYS) return BUCKET_DAYS[p.durationBucket as keyof typeof BUCKET_DAYS];
  return 0;
}

/** Answers the Visa analysis needs and that are not given yet. */
export function missingVisaFields(p: VisaProfile): VisaField[] {
  const missing: VisaField[] = [];
  if (!countryLabel(p.destinationCode)) missing.push("destination");
  if (!countryLabel(p.nationality)) missing.push("nationality");
  if (!countryLabel(p.residence)) missing.push("residence");
  if (!p.stayType) missing.push("stayType");
  if (!visaStayDays(p) && p.durationBucket !== "unknown") missing.push("duration");
  if (!p.passportType) missing.push("passportType");
  if (!p.hasTransit || (p.hasTransit === "yes" && p.transitCountries.length === 0)) missing.push("transit");
  return missing;
}

/** Changes whenever an answer that changes the formalities changes. */
export function visaProfileKey(p: VisaProfile): string {
  return [
    p.destinationCode, p.nationality, p.secondNationality, p.residence, p.stayType, visaStayDays(p),
    p.passportType, p.hasTransit === "yes" ? [...p.transitCountries].sort().join("+") : "none", p.regions.trim().toLowerCase(),
  ].join("|");
}

/** Health advice "depending on the stay": does it clearly match this stay? */
export function healthRelevance(condition: string, days: number): "applies" | "check" {
  const c = (condition || "").toLowerCase();
  const isLong = /(long|prolong|expatri|répét|repeat|plus de \d+ mois|more than \d+ months)/.test(c);
  return isLong && days >= 90 ? "applies" : "check";
}

// ── Saved analysis (one per trip) ──

export type VisaStatus = "required" | "not_required" | "depends" | "to_verify";
export type ChecklistPriority = "required" | "recommended" | "if_applicable";
export type ChecklistCategory = "documents" | "health" | "money" | "practical";

export interface VisaChecklistItem {
  id: string;
  item: string;
  detail: string;
  category: ChecklistCategory;
  priority: ChecklistPriority;
  condition: string;
}

export interface VisaAnalysis {
  visa: {
    status: VisaStatus;
    title: string;
    summary: string;
    max_stay: string;
    cost: string;
    processing_time: string;
    steps: string[];
    why: string;
    official_url: string;
  };
  passport: { summary: string; rules: string[]; id_card_accepted: "yes" | "no" | "unknown" };
  transit: { needed: "yes" | "no" | "to_verify" | "none"; summary: string };
  checklist: VisaChecklistItem[];
  emergency_contacts: { embassy: string; local_emergency: string };
  rule: "free_movement" | null;
  officialGrounded: boolean;
  generatedAt: string;
}

export interface SavedVisaState {
  profileKey: string;
  analysis: VisaAnalysis;
  checked: Record<string, boolean>;
}

const STATE_PREFIX = "xplania-visa-state";
export const visaStateKey = (tripId: string | null | undefined, destinationCode: string) =>
  `${STATE_PREFIX}::${tripId || "no-trip"}::${destinationCode}`;

export function loadVisaState(key: string): SavedVisaState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedVisaState;
    return s?.analysis?.visa && Array.isArray(s.analysis.checklist) ? s : null;
  } catch {
    return null;
  }
}

export function saveVisaState(key: string, state: SavedVisaState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* storage full — the analysis stays on screen */
  }
}

/** Keeps ticks of items that still exist after a new analysis (same id). */
export function carryChecked(previous: Record<string, boolean>, items: VisaChecklistItem[]): Record<string, boolean> {
  const ids = new Set(items.map((i) => i.id));
  return Object.fromEntries(Object.entries(previous).filter(([id, v]) => v && ids.has(id)));
}

const PRIORITIES: ChecklistPriority[] = ["required", "recommended", "if_applicable"];
const CATEGORIES: ChecklistCategory[] = ["documents", "health", "money", "practical"];

/** Cleans an AI answer: unknown values fall back to the safest wording, ids are unique. */
export function normalizeAnalysis(raw: any): VisaAnalysis | null {
  if (!raw?.visa || !Array.isArray(raw?.checklist)) return null;
  const seen = new Set<string>();
  const checklist: VisaChecklistItem[] = raw.checklist
    .filter((c: any) => c && typeof c.item === "string" && c.item.trim())
    .map((c: any, i: number) => {
      let id = String(c.id || `item-${i}`).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 60) || `item-${i}`;
      while (seen.has(id)) id = `${id}-${i}`;
      seen.add(id);
      return {
        id,
        item: String(c.item),
        detail: String(c.detail || ""),
        category: CATEGORIES.includes(c.category) ? c.category : "practical",
        priority: PRIORITIES.includes(c.priority) ? c.priority : "if_applicable",
        condition: String(c.condition || ""),
      };
    });
  const v = raw.visa;
  const status: VisaStatus = ["required", "not_required", "depends", "to_verify"].includes(v.status) ? v.status : "to_verify";
  return {
    visa: {
      status,
      title: String(v.title || ""),
      summary: String(v.summary || ""),
      max_stay: String(v.max_stay || ""),
      cost: String(v.cost || ""),
      processing_time: String(v.processing_time || ""),
      steps: Array.isArray(v.steps) ? v.steps.map(String) : [],
      why: String(v.why || ""),
      official_url: /^https:\/\//.test(String(v.official_url || "")) ? String(v.official_url) : "",
    },
    passport: {
      summary: String(raw.passport?.summary || ""),
      rules: Array.isArray(raw.passport?.rules) ? raw.passport.rules.map(String) : [],
      id_card_accepted: ["yes", "no"].includes(raw.passport?.id_card_accepted) ? raw.passport.id_card_accepted : "unknown",
    },
    transit: {
      needed: ["yes", "no", "to_verify", "none"].includes(raw.transit?.needed) ? raw.transit.needed : "none",
      summary: String(raw.transit?.summary || ""),
    },
    checklist,
    emergency_contacts: {
      embassy: String(raw.emergency_contacts?.embassy || ""),
      local_emergency: String(raw.emergency_contacts?.local_emergency || ""),
    },
    rule: raw.rule === "free_movement" ? "free_movement" : null,
    officialGrounded: !!raw.officialGrounded,
    generatedAt: String(raw.generatedAt || new Date().toISOString()),
  };
}
