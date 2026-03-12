import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepDates = ({ data, update }: Props) => {
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => update({ dateMode: "dates" })}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            data.dateMode === "dates"
              ? "gradient-button text-primary-foreground"
              : "glass-card text-foreground hover:bg-muted"
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Dates précises
        </button>
        <button
          type="button"
          onClick={() => update({ dateMode: "duration" })}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            data.dateMode === "duration"
              ? "gradient-button text-primary-foreground"
              : "glass-card text-foreground hover:bg-muted"
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Durée du voyage
        </button>
      </div>

      {data.dateMode === "dates" ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Date de départ</Label>
            <Input
              type="date"
              value={data.departureDate}
              onChange={(e) => update({ departureDate: e.target.value })}
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Date de retour</Label>
            <Input
              type="date"
              value={data.returnDate}
              onChange={(e) => update({ returnDate: e.target.value })}
              className="bg-muted border-border text-foreground"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Durée (en jours)</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={data.duration}
            onChange={(e) => update({ duration: parseInt(e.target.value) || 1 })}
            className="bg-muted border-border text-foreground"
          />
        </div>
      )}
    </div>
  );
};

export default StepDates;
