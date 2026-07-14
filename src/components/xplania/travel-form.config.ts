// Step order, per-mode step subsets and empty-form defaults for TravelFormDialog.
// Extracted so the dialog component stays focused on flow + UI.

import type { TravelFormData } from "@/types/travel";
import type { PlanMode } from "@/components/xplania/form-steps/ModeSelector";

export type StepKey =
  | "basic"
  | "profile"
  | "objectives"
  | "style"
  | "budget"
  | "accommodation"
  | "transport"
  | "constraints"
  | "environment"
  | "inspirations";

export const STEP_KEYS: StepKey[] = [
  "basic", "profile", "objectives", "style", "budget",
  "accommodation", "transport", "constraints", "environment", "inspirations",
];

export const MODE_STEPS: Record<PlanMode, StepKey[]> = {
  quick: ["basic", "budget", "style"],
  custom: ["basic", "profile", "objectives", "style", "budget", "accommodation", "inspirations"],
  tailored: [
    "basic",
    "profile",
    "objectives",
    "style",
    "budget",
    "accommodation",
    "transport",
    "constraints",
    "environment",
    "inspirations",
  ],
};

export const defaultFormData: TravelFormData = {
  destination: "",
  arrivalCity: "",
  departureLocation: "",
  departureDate: "",
  returnDate: "",
  duration: "",
  tripTypes: [],
  tripTypeOther: "",
  travelerType: "",
  age: 0,
  activityLevel: "",
  languages: [],
  speaksLocalLanguage: "",
  needsFrenchGuide: "",
  travelExperience: "",
  objectives: [],
  objectiveOther: "",
  feelings: [],
  priorities: [],
  organization: "",
  rhythm: "",
  totalBudget: 0,
  spendingPriorities: [],
  accommodationType: "",
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
};
