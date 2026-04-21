import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, Compass, Palmtree, Mountain, Drama, UtensilsCrossed, Dumbbell, Camera, Flame, Snail, Plane, HelpCircle, Search } from "lucide-react";
import type { TravelFormData } from "@/types/travel";
import { searchDeparturePoints, formatDeparturePoint, type DeparturePoint } from "@/data/departure-points";

const TRIP_TYPES: { id: string; icon: React.ReactNode }[] = [
  { id: "Exploration", icon: <Compass className="w-4 h-4" /> },
  { id: "Relaxation", icon: <Palmtree className="w-4 h-4" /> },
  { id: "Aventure", icon: <Mountain className="w-4 h-4" /> },
  { id: "Culture", icon: <Drama className="w-4 h-4" /> },
  { id: "Gastronomie", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "Sport", icon: <Dumbbell className="w-4 h-4" /> },
  { id: "Photographie", icon: <Camera className="w-4 h-4" /> },
  { id: "Spiritualité", icon: <Flame className="w-4 h-4" /> },
  { id: "Voyage slow", icon: <Snail className="w-4 h-4" /> },
  { id: "Autre", icon: <HelpCircle className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepBasicInfo = ({ data, update }: Props) => {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<DeparturePoint[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const toggleTripType = (opt: string) => {
    const current = data.tripTypes;
    update({
      tripTypes: current.includes(opt) ? current.filter((t) => t !== opt) : [...current, opt],
    });
  };

  const handleDepartureChange = (value: string) => {
    update({ departureLocation: value });
    const results = searchDeparturePoints(value);
    setFilteredSuggestions(results);
    setShowSuggestions(results.length > 0);
  };

  const selectSuggestion = (point: DeparturePoint) => {
    update({ departureLocation: formatDeparturePoint(point) });
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> {t("travelForm.fields.country")}
        </Label>
        <Input
          placeholder={t("travelForm.fields.countryPh")}
          value={data.destination}
          onChange={(e) => update({ destination: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> {t("travelForm.fields.arrivalCity")} <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder={t("travelForm.fields.arrivalCityPh")}
          value={data.arrivalCity}
          onChange={(e) => update({ arrivalCity: e.target.value })}
          required
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">{t("travelForm.fields.arrivalCityHint")}</p>
      </div>

      <div className="space-y-2 relative" ref={suggestionsRef}>
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" /> {t("travelForm.fields.departure")}
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("travelForm.fields.departurePh")}
            value={data.departureLocation}
            onChange={(e) => handleDepartureChange(e.target.value)}
            onFocus={() => {
              const results = searchDeparturePoints(data.departureLocation);
              if (results.length > 0) {
                setFilteredSuggestions(results);
                setShowSuggestions(true);
              }
            }}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground pl-10"
          />
        </div>
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 glass-card border border-border rounded-xl max-h-64 overflow-y-auto shadow-lg">
            {filteredSuggestions.map((point) => (
              <button
                key={`${point.code}-${point.type}`}
                type="button"
                onClick={() => selectSuggestion(point)}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3"
              >
                <span className="text-base">{point.type === "airport" ? "✈️" : "🚄"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{point.city} — {point.name}</p>
                  <p className="text-xs text-muted-foreground">{point.country} • [{point.code}]</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> {t("travelForm.fields.departureDate")}
          </Label>
          <Input
            type="date"
            value={data.departureDate}
            onChange={(e) => update({ departureDate: e.target.value })}
            className="bg-muted border-border text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> {t("travelForm.fields.returnDate")}
          </Label>
          <Input
            type="date"
            value={data.returnDate}
            onChange={(e) => update({ returnDate: e.target.value })}
            className="bg-muted border-border text-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> {t("travelForm.fields.duration")}
        </Label>
        <Input
          placeholder={t("travelForm.fields.durationPh")}
          value={data.duration}
          onChange={(e) => update({ duration: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.tripType")}</Label>
        <div className="flex flex-wrap gap-2">
          {TRIP_TYPES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleTripType(opt.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                data.tripTypes.includes(opt.id)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt.icon}
              {t(`travelForm.options.tripType.${opt.id}`)}
            </button>
          ))}
        </div>
      </div>

      {data.tripTypes.includes("Autre") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" /> {t("travelForm.fields.tripTypeOtherLabel")}
          </Label>
          <Input
            placeholder={t("travelForm.fields.tripTypeOtherPh")}
            value={data.tripTypeOther}
            onChange={(e) => update({ tripTypeOther: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
};

export default StepBasicInfo;
