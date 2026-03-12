import { Label } from "@/components/ui/label";
import { Home } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TYPES = ["Hôtel", "Gîte", "Airbnb", "Camping", "Résidence", "Maison", "Autre"];
const STANDINGS = ["Budget", "Moyen", "Haut", "Luxe"];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const SelectButton = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      selected ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
    }`}
  >
    {label}
  </button>
);

const StepAccommodation = ({ data, update }: Props) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label className="text-foreground font-semibold flex items-center gap-2">
        <Home className="w-4 h-4 text-primary" /> Type d'hébergement
      </Label>
      <div className="flex flex-wrap gap-2">
        {TYPES.map((opt) => (
          <SelectButton key={opt} selected={data.accommodationType === opt} label={opt} onClick={() => update({ accommodationType: opt })} />
        ))}
      </div>
    </div>

    <div className="space-y-2">
      <Label className="text-foreground font-semibold">Standing</Label>
      <div className="flex flex-wrap gap-2">
        {STANDINGS.map((opt) => (
          <SelectButton key={opt} selected={data.accommodationStanding === opt} label={opt} onClick={() => update({ accommodationStanding: opt })} />
        ))}
      </div>
    </div>
  </div>
);

export default StepAccommodation;
