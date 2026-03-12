export interface TravelFormData {
  // Section 1 - Destination
  destination: string;
  departure: string;
  
  // Section 2 - Dates
  dateMode: 'dates' | 'duration';
  departureDate: string;
  returnDate: string;
  duration: number;
  
  // Section 3 - Travelers
  travelerCount: number;
  travelerType: 'solo' | 'couple' | 'amis' | 'famille' | 'business';
  
  // Section 4 - Trip type
  tripTypes: string[];
  tripTypeOther: string;
  
  // Section 5 - Budget
  totalBudget: number;
  
  // Section 6 - Accommodation
  accommodations: string[];
  accommodationOther: string;
  
  // Section 7 - Transport
  transports: string[];
  transportPreference: string;
  
  // Section 8 - Food
  dietaryPreferences: string[];
  dietaryOther: string;
  
  // Section 9 - Activities
  activities: string[];
  activityOther: string;
  
  // Section 10 - Luggage
  luggageType: string;
  
  // Section 11 - Weather (display only)
  
  // Section 12 - AI generation (output)
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
