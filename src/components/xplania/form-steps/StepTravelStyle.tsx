import { Label } from "@/components/ui/label";
import { Compass } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const ORGANIZATION = ["Planifié", "Équilibré", "Spontané"];
const RHYTHM = ["Intensif", "Modéré", "Tranquille"];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const SelectButton = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
      selected ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
    }`}
  >
    {label}
  </button>
);

const StepTravelStyle = ({ data, update }: Props) => (
  <div className="space-y-6">
    <div className="space-y-3">
      <Label className="text-foreground font-semibold flex items-center gap-2">
        <Compass className="w-4 h-4 text-primary" /> Organisation du voyage
      </Label>
      <div className="flex flex-wrap gap-3">
        {ORGANIZATION.map((opt) => (
          <SelectButton key={opt} selected={data.organization === opt} label={opt} onClick={() => update({ organization: opt })} />
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <Label className="text-foreground font-semibold">Rythme du voyage</Label>
      <div className="flex flex-wrap gap-3">
        {RHYTHM.map((opt) => (
          <SelectButton key={opt} selected={data.rhythm === opt} label={opt} onClick={() => update({ rhythm: opt })} />
        ))}
      </div>
    </div>
  </div>
);

export default StepTravelStyle;
