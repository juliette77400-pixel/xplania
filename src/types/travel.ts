export interface TravelFormData {
  // Section 1 - Informations de base
  destination: string;
  departureDate: string;
  returnDate: string;
  duration: string;
  tripTypes: string[];

  // Section 2 - Profil du voyageur
  travelerType: string;
  age: number;
  activityLevel: string;
  languages: string[];
  speaksLocalLanguage: string;
  needsFrenchGuide: string;
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
  accommodationStanding: string;

  // Section 7 - Transport
  bookingStatus: string;
  hasStopover: string;
  localTransport: string[];
  hasInternationalPermit: string;

  // Section 8 - Contraintes
  constraints: string[];
  childrenCount: number;
  importantNotes: string;
  dietaryPreferences: string[];
  dietaryOther: string;

  // Section 9 - Préférences environnementales
  connectivity: string;
  climatePreference: string;

  // Section 10 - Inspirations
  inspirations: string;
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
