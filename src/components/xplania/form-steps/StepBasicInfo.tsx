import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TRIP_TYPES = [
  "Exploration", "Relaxation", "Aventure", "Culture",
  "Gastronomie", "Sport", "Photographie", "Spiritualité", "Voyage slow"
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepBasicInfo = ({ data, update }: Props) => {
  const toggleTripType = (opt: string) => {
    const current = data.tripTypes;
    update({
      tripTypes: current.includes(opt)
        ? current.filter((t) => t !== opt)
        : [...current, opt],
    });
  };

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
              key={opt}
              type="button"
              onClick={() => toggleTripType(opt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                data.tripTypes.includes(opt)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepBasicInfo;
