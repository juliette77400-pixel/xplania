import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { useTravelStore } from "@/stores/useTravelStore";
import type { TravelFormData, TravelRecommendations } from "@/types/travel";

interface ActiveTripState {
  tripId: string | null;
  destination: string | null;
  arrivalCity: string | null;
  departureDate: string | null;
  returnDate: string | null;
  setActiveTrip: (info: {
    tripId: string;
    destination?: string | null;
    arrivalCity?: string | null;
    departureDate?: string | null;
    returnDate?: string | null;
  }) => void;
  clearActiveTrip: () => void;
}

/**
 * useActiveTrip — single source of truth for "which trip is the user currently working on".
 * Persisted to localStorage so navigation between modules keeps the same trip context.
 */
export const useActiveTrip = create<ActiveTripState>()(
  persist(
    (set) => ({
      tripId: null,
      destination: null,
      arrivalCity: null,
      departureDate: null,
      returnDate: null,
      setActiveTrip: (info) =>
        set({
          tripId: info.tripId,
          destination: info.destination ?? null,
          arrivalCity: info.arrivalCity ?? null,
          departureDate: info.departureDate ?? null,
          returnDate: info.returnDate ?? null,
        }),
      clearActiveTrip: () =>
        set({
          tripId: null,
          destination: null,
          arrivalCity: null,
          departureDate: null,
          returnDate: null,
        }),
    }),
    { name: "xplania-active-trip" },
  ),
);

/**
 * Hydrates the global useTravelStore (form + recommendations) from a trip row.
 * Modules like Valise/Budget/Visa read useTravelStore — calling this ensures
 * they have data even when the user opens them directly via QuickJump.
 */
export async function hydrateTravelStoreFromTrip(tripId: string): Promise<void> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, destination, arrival_city, departure_location, departure_date, return_date, duration, form_data, recommendations")
    .eq("id", tripId)
    .maybeSingle();

  if (error || !data) return;

  const form = (data.form_data as Partial<TravelFormData>) || {};
  const merged: TravelFormData = {
    ...(form as TravelFormData),
    destination: form.destination || data.destination || "",
    arrivalCity: form.arrivalCity || data.arrival_city || "",
    departureLocation: form.departureLocation || data.departure_location || "",
    departureDate: form.departureDate || data.departure_date || "",
    returnDate: form.returnDate || data.return_date || "",
    duration: form.duration || (data.duration ? String(data.duration) : ""),
  } as TravelFormData;

  const store = useTravelStore.getState();
  store.setTripData(merged);
  if (data.recommendations) {
    store.setRecommendations(data.recommendations as TravelRecommendations);
  }

  useActiveTrip.getState().setActiveTrip({
    tripId: data.id,
    destination: data.destination,
    arrivalCity: data.arrival_city,
    departureDate: data.departure_date,
    returnDate: data.return_date,
  });
}
