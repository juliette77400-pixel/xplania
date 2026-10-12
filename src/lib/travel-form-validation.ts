import type { TravelFormData } from "@/types/travel";

export function validateTravelBasics(data: TravelFormData): string | null {
  if (!data.destination.trim() || !data.arrivalCity.trim()) return "travelForm.validation.destination";
  if (data.departureDate && data.returnDate && data.returnDate < data.departureDate) return "travelForm.validation.dates";
  if (!data.departureDate || !data.returnDate) {
    if (!Number.isFinite(parseInt(data.duration, 10)) || parseInt(data.duration, 10) < 1) return "travelForm.validation.duration";
  }
  return null;
}