import { Label } from "@/components/ui/label";
import { Wifi, CloudSun } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const CONNECTIVITY = ["Aucune", "Faible", "Moyenne", "Bonne"];
const CLIMATE = ["Chaud", "Froid", "Moyen", "Tropical"];

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

const StepEnvironment = ({ data, update }: Props) => (
  <div className="space-y-6">
    <div className="space-y-3">
      <Label className="text-foreground font-semibold flex items-center gap-2">
        <Wifi className="w-4 h-4 text-primary" /> Connectivité souhaitée
      </Label>
      <div className="flex flex-wrap gap-3">
        {CONNECTIVITY.map((opt) => (
          <SelectButton key={opt} selected={data.connectivity === opt} label={opt} onClick={() => update({ connectivity: opt })} />
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <Label className="text-foreground font-semibold flex items-center gap-2">
        <CloudSun className="w-4 h-4 text-primary" /> Préférence climatique
      </Label>
      <div className="flex flex-wrap gap-3">
        {CLIMATE.map((opt) => (
          <SelectButton key={opt} selected={data.climatePreference === opt} label={opt} onClick={() => update({ climatePreference: opt })} />
        ))}
      </div>
    </div>
  </div>
);

export default StepEnvironment;
