import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, Compass, Palmtree, Mountain, Drama, UtensilsCrossed, Dumbbell, Camera, Flame, Snail, Plane, HelpCircle } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TRIP_TYPES: { label: string; icon: React.ReactNode }[] = [
  { label: "Exploration", icon: <Compass className="w-4 h-4" /> },
  { label: "Relaxation", icon: <Palmtree className="w-4 h-4" /> },
  { label: "Aventure", icon: <Mountain className="w-4 h-4" /> },
  { label: "Culture", icon: <Drama className="w-4 h-4" /> },
  { label: "Gastronomie", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { label: "Sport", icon: <Dumbbell className="w-4 h-4" /> },
  { label: "Photographie", icon: <Camera className="w-4 h-4" /> },
  { label: "Spiritualité", icon: <Flame className="w-4 h-4" /> },
  { label: "Voyage slow", icon: <Snail className="w-4 h-4" /> },
  { label: "Autre", icon: <HelpCircle className="w-4 h-4" /> },
];

const DEPARTURE_SUGGESTIONS = [
  "Paris - CDG (Aéroport)", "Paris - Orly (Aéroport)", "Lyon - Saint-Exupéry (Aéroport)",
  "Marseille - Provence (Aéroport)", "Nice - Côte d'Azur (Aéroport)", "Toulouse - Blagnac (Aéroport)",
  "Bordeaux - Mérignac (Aéroport)", "Nantes - Atlantique (Aéroport)", "Lille - Lesquin (Aéroport)",
  "Strasbourg (Gare/Aéroport)", "Montpellier (Aéroport)", "Bruxelles - Zaventem (Aéroport)",
  "Genève (Aéroport)", "Londres - Heathrow (Aéroport)", "Amsterdam - Schiphol (Aéroport)",
  "Paris (Ville)", "Lyon (Ville)", "Marseille (Ville)", "Bordeaux (Ville)", "Nice (Ville)",
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepBasicInfo = ({ data, update }: Props) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const toggleTripType = (opt: string) => {
    const current = data.tripTypes;
    update({
      tripTypes: current.includes(opt)
        ? current.filter((t) => t !== opt)
        : [...current, opt],
    });
  };

  const handleDepartureChange = (value: string) => {
    update({ departureLocation: value });
    if (value.length >= 2) {
      const filtered = DEPARTURE_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    update({ departureLocation: suggestion });
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
          <MapPin className="w-4 h-4 text-primary" /> Destination
        </Label>
        <Input
          placeholder="Ex : Tokyo, Japon"
          value={data.destination}
          onChange={(e) => update({ destination: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2 relative" ref={suggestionsRef}>
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" /> Lieu de départ
        </Label>
        <Input
          placeholder="Tapez pour rechercher (aéroport, ville, pays...)"
          value={data.departureLocation}
          onChange={(e) => handleDepartureChange(e.target.value)}
          onFocus={() => {
            if (data.departureLocation.length >= 2) {
              const filtered = DEPARTURE_SUGGESTIONS.filter((s) =>
                s.toLowerCase().includes(data.departureLocation.toLowerCase())
              );
              setFilteredSuggestions(filtered);
              setShowSuggestions(filtered.length > 0);
            }
          }}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 glass-card border border-border rounded-xl max-h-48 overflow-y-auto shadow-lg">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Date de départ
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
            <Calendar className="w-4 h-4 text-primary" /> Date de retour
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
          <Clock className="w-4 h-4 text-primary" /> Durée du séjour
        </Label>
        <Input
          placeholder="Ex : 14 jours"
          value={data.duration}
          onChange={(e) => update({ duration: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Type de voyage</Label>
        <div className="flex flex-wrap gap-2">
          {TRIP_TYPES.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => toggleTripType(opt.label)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                data.tripTypes.includes(opt.label)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {data.tripTypes.includes("Autre") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" /> Précisez votre type de voyage
          </Label>
          <Input
            placeholder="Ex : Voyage humanitaire, road trip en van..."
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
