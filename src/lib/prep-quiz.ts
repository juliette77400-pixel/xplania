// Rules of the preparation questionnaire (6 card steps). Pure functions so the
// rules can be tested without rendering: which answers are required, how the
// answers become the trip read by the four guides.
import { countryList } from "@/lib/countries";
import type { TravelFormData } from "@/types/travel";

export const PREP_STEPS = ["destination", "origin", "stay", "dates", "budget", "housing"] as const;
export type PrepStep = (typeof PREP_STEPS)[number];

export type PrepStayType = "erasmus" | "internship" | "other";
export type DurationBucket = "lt3" | "3to6" | "gt6" | "unknown";
export type Housing = "residence" | "flatshare" | "family" | "unknown";

export const STAY_TYPES: PrepStayType[] = ["erasmus", "internship", "other"];
export const DURATION_BUCKETS: DurationBucket[] = ["lt3", "3to6", "gt6", "unknown"];
export const HOUSING_OPTIONS: Housing[] = ["residence", "flatshare", "family", "unknown"];

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

/** Builds the trip data shared by the four guides. Labels come from the UI language. */
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
  };
}
