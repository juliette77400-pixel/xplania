// Rules of the preparation questionnaire (7 card steps). Pure functions so the
// rules can be tested without rendering: which answers are required, how the
// answers become the trip read by the preparation tools.
import { countryList } from "@/lib/countries";
import type { TravelFormData } from "@/types/travel";
import { HOUSING_STATUSES, isHousingStatus, type HousingStatus } from "@/lib/housing";

export const PREP_STEPS = ["destination", "origin", "stay", "dates", "budget", "housing", "housingStatus"] as const;
export type PrepStep = (typeof PREP_STEPS)[number];

export type PrepStayType = "erasmus" | "internship" | "other";
export type DurationBucket = "lt3" | "3to6" | "gt6" | "unknown";
export type Housing = "residence" | "flatshare" | "family" | "unknown";

export const STAY_TYPES: PrepStayType[] = ["erasmus", "internship", "other"];
export const DURATION_BUCKETS: DurationBucket[] = ["lt3", "3to6", "gt6", "unknown"];
export const HOUSING_OPTIONS: Housing[] = ["residence", "flatshare", "family", "unknown"];
export { HOUSING_STATUSES };

/** Approximate length (days) used by the guides when only a bucket is known. */
export const BUCKET_DAYS: Record<Exclude<DurationBucket, "unknown">, number> = {
  lt3: 60,
  "3to6": 135,
  gt6: 270,
};

export interface PrepAnswers {
  destinationCode: string;
  city: string;
  nationality: string;
  residence: string;
  secondNationality: string;
  stayType: PrepStayType | "";
  departureDate: string;
  returnDate: string;
  durationBucket: DurationBucket | "";
  budget: string;
  budgetUnknown: boolean;
  housing: Housing | "";
  housingStatus: HousingStatus | "";
}

export const emptyPrepAnswers = (): PrepAnswers => ({
  destinationCode: "",
  city: "",
  nationality: "",
  residence: "",
  secondNationality: "",
  stayType: "",
  departureDate: "",
  returnDate: "",
  durationBucket: "",
  budget: "",
  budgetUnknown: false,
  housing: "",
  housingStatus: "",
});

export const countryName = (code: string | null | undefined): string =>
  (code && countryList.find((c) => c.code === code)?.name) || "";

const daysBetween = (a: string, b: string) =>
  Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1);

/** Returns an i18n error key when the step cannot be validated, otherwise null. */
export function validatePrepStep(step: PrepStep, a: PrepAnswers): string | null {
  switch (step) {
    case "destination":
      return countryName(a.destinationCode) ? null : "prepQuiz.errors.destination";
    case "origin":
      if (!countryName(a.nationality)) return "prepQuiz.errors.nationality";
      if (!countryName(a.residence)) return "prepQuiz.errors.residence";
      return null;
    case "stay":
      return a.stayType ? null : "prepQuiz.errors.stay";
    case "dates":
      if (a.departureDate && a.returnDate && a.returnDate < a.departureDate) return "prepQuiz.errors.dates";
      if (!a.departureDate && !a.durationBucket) return "prepQuiz.errors.datesMissing";
      return null;
    case "budget":
      if (a.budgetUnknown) return null;
      return Number(a.budget) > 0 ? null : "prepQuiz.errors.budget";
    case "housing":
      return a.housing ? null : "prepQuiz.errors.housing";
    case "housingStatus":
      return a.housingStatus ? null : "prepQuiz.errors.housingStatus";
  }
}

/** First step that is not valid yet, or null when every answer is valid. */
export function firstInvalidStep(a: PrepAnswers): PrepStep | null {
  return PREP_STEPS.find((s) => validatePrepStep(s, a) !== null) ?? null;
}

/** Number of days known for the stay ("" when unknown). */
export function stayDurationDays(a: Pick<PrepAnswers, "departureDate" | "returnDate" | "durationBucket">): string {
  if (a.departureDate && a.returnDate && a.returnDate >= a.departureDate) return String(daysBetween(a.departureDate, a.returnDate));
  if (a.durationBucket && a.durationBucket !== "unknown") return String(BUCKET_DAYS[a.durationBucket]);
  return "";
}

/** Builds the trip data shared by the preparation tools. Labels come from the UI language. */
export function buildTripFromAnswers(
  a: PrepAnswers,
  labels: { tripType: string; accommodation: string },
): TravelFormData {
  const destination = countryName(a.destinationCode);
  return {
    destination,
    arrivalCity: a.city.trim() || destination,
    departureLocation: countryName(a.residence),
    departureDate: a.departureDate,
    returnDate: a.returnDate,
    duration: stayDurationDays(a),
    tripTypes: labels.tripType ? [labels.tripType] : [],
    tripTypeOther: "",
    travelerType: "",
    age: 0,
    activityLevel: "",
    languages: [],
    speaksLocalLanguage: "",
    travelExperience: "",
    objectives: [],
    objectiveOther: "",
    feelings: [],
    priorities: [],
    organization: "",
    rhythm: "",
    totalBudget: a.budgetUnknown ? 0 : Math.max(0, Math.round(Number(a.budget) || 0)),
    spendingPriorities: [],
    accommodationType: a.housing && a.housing !== "unknown" ? labels.accommodation : "",
    accommodationTypeOther: "",
    accommodationStanding: "",
    bookingStatus: "",
    hasStopover: "",
    stopoverCount: 0,
    localTransport: [],
    hasInternationalPermit: "",
    constraints: [],
    childrenCount: 0,
    animalDetails: "",
    mobilityDetails: "",
    budgetDetails: "",
    timeDetails: "",
    importantNotes: "",
    dietaryPreferences: [],
    dietaryOther: "",
    connectivity: "",
    climatePreference: "",
    environmentalSensitivity: "",
    culturalImmersion: "",
    baggageTypes: [],
    inspirations: "",
    nationality: a.nationality,
    residence: a.residence,
    secondNationality: a.secondNationality || "",
    stayType: a.stayType,
    durationBucket: a.departureDate && a.returnDate ? "" : a.durationBucket,
    budgetUnknown: a.budgetUnknown,
    housing: a.housing,
    housingStatus: a.housingStatus,
  };
}

/** Reads the questionnaire answers back from a saved trip (for editing). */
export function answersFromTrip(form: Partial<TravelFormData> | null | undefined, destination?: string | null): PrepAnswers {
  const f = form || {};
  const destName = f.destination || destination || "";
  const destinationCode = countryList.find((c) => c.name.toLowerCase() === destName.toLowerCase())?.code || "";
  const stay = f.stayType === "erasmus" || f.stayType === "internship" || f.stayType === "other" ? f.stayType : f.stayType ? "other" : "";
  return {
    destinationCode,
    city: f.arrivalCity && f.arrivalCity !== destName ? f.arrivalCity : "",
    nationality: f.nationality || "",
    residence: f.residence || "",
    secondNationality: f.secondNationality || "",
    stayType: stay as PrepStayType | "",
    departureDate: f.departureDate || "",
    returnDate: f.returnDate || "",
    durationBucket: (f.durationBucket as DurationBucket) || "",
    budget: f.totalBudget ? String(f.totalBudget) : "",
    budgetUnknown: !!f.budgetUnknown,
    housing: (f.housing as Housing) || "",
    housingStatus: isHousingStatus(f.housingStatus) ? f.housingStatus : "",
  };
}

// Visitors answer before having an account; the answers stay in this browser
// and become their trip right after they sign up.
export const GUEST_DRAFT_KEY = "xplania:prep-quiz:guest";
/** Where a visitor with finished answers lands after signing up or in, so the answers become the trip. */
export const PREP_RESUME_PATH = "/preparation?resume=1";

/** True when a visitor finished the questionnaire in this browser and has not saved it yet. */
export function hasCompleteGuestDraft(storage: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): boolean {
  try {
    const raw = storage?.getItem(GUEST_DRAFT_KEY);
    return !!raw && (JSON.parse(raw) as { complete?: boolean }).complete === true;
  } catch {
    return false;
  }
}

// A visitor may confirm their email on another device (e.g. phone) than the one
// used for the questionnaire. Their finished answers are therefore also sent with
// the signup (account metadata, user-editable) and read back here, as plain data.
export const ACCOUNT_DRAFT_META_KEY = "prep_draft";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | "" => (list as readonly string[]).includes(v as string) ? (v as T) : "";

/** Cleans answers coming from storage or account metadata; null unless every step is valid. */
export function cleanFinishedAnswers(raw: unknown): PrepAnswers | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const date = (v: unknown) => (typeof v === "string" && DATE_RE.test(v) ? v : "");
  const a: PrepAnswers = {
    destinationCode: str(r.destinationCode, 3).toUpperCase(),
    city: str(r.city),
    nationality: str(r.nationality, 3).toUpperCase(),
    residence: str(r.residence, 3).toUpperCase(),
    secondNationality: str(r.secondNationality, 3).toUpperCase(),
    stayType: oneOf(r.stayType, STAY_TYPES),
    departureDate: date(r.departureDate),
    returnDate: date(r.returnDate),
    durationBucket: oneOf(r.durationBucket, DURATION_BUCKETS),
    budget: str(r.budget, 12).replace(/[^\d.]/g, ""),
    budgetUnknown: r.budgetUnknown === true,
    housing: oneOf(r.housing, HOUSING_OPTIONS),
    housingStatus: isHousingStatus(r.housingStatus as string) ? (r.housingStatus as HousingStatus) : "",
  };
  return firstInvalidStep(a) === null ? a : null;
}

/** Finished visitor answers saved in this browser, cleaned; null when none. */
export function finishedGuestAnswers(storage: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): PrepAnswers | null {
  try {
    const raw = storage?.getItem(GUEST_DRAFT_KEY);
    const d = raw ? (JSON.parse(raw) as { answers?: unknown; complete?: boolean }) : null;
    return d?.complete === true ? cleanFinishedAnswers(d.answers) : null;
  } catch {
    return null;
  }
}

/** True when the account already has the trip these answers describe (same country and departure date). */
export function answersMatchTrip(a: PrepAnswers, trips: Array<{ destination?: string | null; departure_date?: string | null }>): boolean {
  const destination = countryName(a.destinationCode);
  const departure = a.departureDate || null;
  return trips.some((t) => (t.destination || "") === destination && (t.departure_date || null) === departure);
}
