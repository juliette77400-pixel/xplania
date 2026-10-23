// Short beta onboarding: the only questions the four preparation tools need
// (destination, dates, nationality, approximate budget, type of stay).
// No AI call — the trip is saved directly and the tools read it.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, CalendarDays, Flag, Wallet, GraduationCap, Briefcase, Plane } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { countryList } from "@/lib/countries";
import { validateTravelBasics } from "@/lib/travel-form-validation";
import { track } from "@/lib/analytics";
import { useActiveTrip } from "@/stores/useActiveTrip";
import { useTravelStore } from "@/stores/useTravelStore";
import type { TravelFormData } from "@/types/travel";

export type StayType = "erasmus" | "internship" | "trip";

const STAY_TYPES: Array<{ value: StayType; icon: typeof Plane; tripType: string }> = [
  { value: "erasmus", icon: GraduationCap, tripType: "Erasmus / études" },
  { value: "internship", icon: Briefcase, tripType: "Stage professionnel" },
  { value: "trip", icon: Plane, tripType: "Voyage" },
];

const daysBetween = (a: string, b: string) =>
  Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1);

/** Builds a complete TravelFormData from the short form (other fields stay empty). */
export function buildPrepTripData(input: {
  destination: string;
  city: string;
  departureDate: string;
  returnDate: string;
  duration: string;
  nationality: string;
  budget: string;
  stayType: StayType;
}): TravelFormData {
  const duration =
    input.departureDate && input.returnDate && input.returnDate >= input.departureDate
      ? String(daysBetween(input.departureDate, input.returnDate))
      : input.duration.trim();
  const stay = STAY_TYPES.find((s) => s.value === input.stayType) ?? STAY_TYPES[2];
  return {
    destination: input.destination.trim(),
    arrivalCity: input.city.trim() || input.destination.trim(),
    departureLocation: "",
    departureDate: input.departureDate,
    returnDate: input.returnDate,
    duration,
    tripTypes: [stay.tripType],
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
    totalBudget: Math.max(0, Number(input.budget) || 0),
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
    nationality: input.nationality,
    stayType: input.stayType,
  };
}

interface Props {
  onCreated?: (tripId: string) => void;
  onCancel?: () => void;
}

const CreateTripForm = ({ onCreated, onCancel }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const setActiveTrip = useActiveTrip((s) => s.setActiveTrip);
  const setTripData = useTravelStore((s) => s.setTripData);
  const setRecommendations = useTravelStore((s) => s.setRecommendations);

  const [destination, setDestination] = useState("");
  const [city, setCity] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [duration, setDuration] = useState("");
  const [nationality, setNationality] = useState("FR");
  const [budget, setBudget] = useState("");
  const [stayType, setStayType] = useState<StayType>("erasmus");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    const data = buildPrepTripData({ destination, city, departureDate, returnDate, duration, nationality, budget, stayType });
    const invalid = validateTravelBasics(data);
    if (invalid) {
      setError(t(invalid));
      return;
    }
    setError(null);
    setSaving(true);
    const { data: trip, error: insertError } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        title: t("index.tripTitle", { destination: data.destination }),
        destination: data.destination,
        arrival_city: data.arrivalCity,
        departure_date: data.departureDate || null,
        return_date: data.returnDate || null,
        duration: data.duration ? parseInt(data.duration, 10) : null,
        form_data: data as never,
      })
      .select("id")
      .single();
    setSaving(false);
    if (insertError || !trip) {
      setError(t("travelForm.saveError"));
      toast.error(t("travelForm.saveError"));
      return;
    }
    track("trip_created", { trip_id: trip.id, flow: "prep" });
    // Refresh the trip list first so the dashboard can find the new trip
    // as soon as it becomes the active one.
    await queryClient.invalidateQueries({ queryKey: ["trips"] });
    setTripData(data);
    setRecommendations(null);
    setActiveTrip({
      tripId: trip.id,
      destination: data.destination,
      arrivalCity: data.arrivalCity,
      departureDate: data.departureDate || null,
      returnDate: data.returnDate || null,
    });
    toast.success(t("prepTrip.created", { destination: data.destination }));
    onCreated?.(trip.id);
  };

  const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground";

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="prep-destination" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{t("prepTrip.destination")}</Label>
          <Input id="prep-destination" list="prep-countries" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={t("prepTrip.destinationPlaceholder")} required autoComplete="off" />
          <datalist id="prep-countries">
            {countryList.map((c) => <option key={c.code} value={c.name} />)}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prep-city">{t("prepTrip.city")}</Label>
          <Input id="prep-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("prepTrip.cityPlaceholder")} autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prep-dep" className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-primary" />{t("prepTrip.departure")}</Label>
          <Input id="prep-dep" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prep-ret">{t("prepTrip.return")}</Label>
          <Input id="prep-ret" type="date" min={departureDate || undefined} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </div>
        {!(departureDate && returnDate) && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="prep-duration">{t("prepTrip.duration")}</Label>
            <Input id="prep-duration" type="number" min={1} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder={t("prepTrip.durationPlaceholder")} />
            <p className="text-xs text-muted-foreground">{t("prepTrip.durationHint")}</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="prep-nationality" className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5 text-primary" />{t("prepTrip.nationality")}</Label>
          <select id="prep-nationality" className={field} value={nationality} onChange={(e) => setNationality(e.target.value)}>
            {countryList.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prep-budget" className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-primary" />{t("prepTrip.budget")}</Label>
          <Input id="prep-budget" type="number" min={0} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={t("prepTrip.budgetPlaceholder")} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("prepTrip.stayType")}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {STAY_TYPES.map(({ value, icon: Icon }) => (
            <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition-colors ${stayType === value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              <input type="radio" name="prep-stay" value={value} checked={stayType === value} onChange={() => setStayType(value)} className="sr-only" />
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              {t(`prepTrip.stay.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>{t("common.cancel")}</Button>}
        <Button type="submit" className="gradient-button" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("prepTrip.submit")}
        </Button>
      </div>
    </form>
  );
};

export default CreateTripForm;
