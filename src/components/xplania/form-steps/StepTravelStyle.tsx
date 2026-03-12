import { Label } from "@/components/ui/label";
import { Compass, ClipboardList, Scale, Zap, Gauge, Snail, Activity } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const ORGANIZATION: { label: string; icon: React.ReactNode }[] = [
  { label: "Planifié", icon: <ClipboardList className="w-4 h-4" /> },
  { label: "Équilibré", icon: <Scale className="w-4 h-4" /> },
  { label: "Spontané", icon: <Zap className="w-4 h-4" /> },
];

const RHYTHM: { label: string; icon: React.ReactNode }[] = [
  { label: "Intensif", icon: <Gauge className="w-4 h-4" /> },
  { label: "Modéré", icon: <Activity className="w-4 h-4" /> },
  { label: "Tranquille", icon: <Snail className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const SelectButton = ({ selected, label, onClick, icon }: { selected: boolean; label: string; onClick: () => void; icon?: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
      selected ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
    }`}
  >
    {icon}
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
          <SelectButton key={opt.label} selected={data.organization === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ organization: opt.label })} />
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <Label className="text-foreground font-semibold">Rythme du voyage</Label>
      <div className="flex flex-wrap gap-3">
        {RHYTHM.map((opt) => (
          <SelectButton key={opt.label} selected={data.rhythm === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ rhythm: opt.label })} />
        ))}
      </div>
    </div>
  </div>
);

export default StepTravelStyle;
