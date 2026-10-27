export interface TravelFormData {
  // Section 1 - Informations de base
  destination: string;
  arrivalCity: string;
  departureLocation: string;
  departureDate: string;
  returnDate: string;
  duration: string;
  tripTypes: string[];
  tripTypeOther: string;

  // Section 2 - Profil du voyageur
  travelerType: string;
  age: number;
  activityLevel: string;
  languages: string[];
  speaksLocalLanguage: string;
  travelExperience: string;

  // Section 3 - Objectif du voyage
  objectives: string[];
  objectiveOther: string;
  feelings: string[];
  priorities: string[];

  // Section 4 - Style de voyage
  organization: string;
  rhythm: string;

  // Section 5 - Budget
  totalBudget: number;
  spendingPriorities: string[];

  // Section 6 - Hébergement
  accommodationType: string;
  accommodationTypeOther: string;
  accommodationStanding: string;

  // Section 7 - Transport
  bookingStatus: string;
  hasStopover: string;
  stopoverCount: number;
  localTransport: string[];
  hasInternationalPermit: string;

  // Section 8 - Contraintes
  constraints: string[];
  childrenCount: number;
  animalDetails: string;
  mobilityDetails: string;
  budgetDetails: string;
  timeDetails: string;
  importantNotes: string;
  dietaryPreferences: string[];
  dietaryOther: string;

  // Section 9 - Préférences environnementales
  connectivity: string;
  climatePreference: string;
  environmentalSensitivity: string;
  culturalImmersion: string;
  baggageTypes: string[];

  // Section 10 - Inspirations
  inspirations: string;

  // Beta preparation questionnaire (optional so older trips stay valid)
  /** ISO code of the traveler's nationality, used by the Visa guide. */
  nationality?: string;
  /** ISO code of the current country of residence. */
  residence?: string;
  /** ISO code of an optional second nationality. */
  secondNationality?: string;
  /** "erasmus" | "internship" | "other" (older trips may hold "trip"). */
  stayType?: string;
  /** Estimated length when dates are unknown: "lt3" | "3to6" | "gt6" | "unknown". */
  durationBucket?: string;
  /** True when the student does not know their budget yet. */
  budgetUnknown?: boolean;
  /** "residence" | "flatshare" | "family" | "unknown" */
  housing?: string;
  /** Housing search status: "starting" | "shortlist" | "confirmed" | "lost". */
  housingStatus?: string;

  // Visa guide details (asked on the Visa page only when needed)
  /** "ordinary" | "other" (diplomatic, service, refugee travel document…). */
  passportType?: string;
  /** "yes" | "no" — whether the trip stops in another country. */
  hasTransit?: string;
  /** ISO codes of transit countries. */
  transitCountries?: string[];
  /** Free text: cities or regions the student will visit. */
  visitedRegions?: string;
  /** Maximum monthly rent set in the housing assistant (overrides the Budget value). */
  maxRent?: number | null;

  // Valise guide choices, saved per trip
  /** Planned activities (ids from src/lib/valise-activities.ts). */
  valiseActivities?: string[];
  /** Activity typed by the student. */
  valiseActivityOther?: string;
  /** Transport to get there: "avion" | "train" | "voiture" | "bateau" | "velo". */
  valiseTransport?: string;
}

export interface WeatherData {
  current: string;
  temperature: string;
  forecast: string;
  advice: string;
  source?: string;
}

export interface CulturalTip {
  title: string;
  description: string;
}

export interface Activity {
  name: string;
  description: string;
  type: "culture" | "nature" | "gastronomie" | "aventure";
  estimatedCost: string;
  budgetFriendly?: boolean;
}

export interface LocalRecommendation {
  category: "restaurant" | "transport" | "quartier" | "marché";
  name: string;
  description: string;
  city?: string;
  neighborhood?: string;
}

export interface BudgetItem {
  category: string;
  amount: number;
  tip: string;
}

export interface TravelRecommendations {
  weather: WeatherData;
  culturalTips: CulturalTip[];
  activities: Activity[];
  localRecommendations: LocalRecommendation[];
  documents: string[];
  luggage: string[];
  budgetBreakdown: BudgetItem[];
}

export interface TravelPlan {
  budgetEstimate: {
    total: number;
    perDay: number;
    breakdown: { category: string; amount: number }[];
  };
  documents: string[];
  luggage: string[];
  culturalTips: string[];
  weatherInfo: string;
  localRecommendations: string[];
}
