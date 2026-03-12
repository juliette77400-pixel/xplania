import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Hotel, Tent, Building, House, Castle, HelpCircle, Star, DollarSign, Crown, Gem } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TYPES: { label: string; icon: React.ReactNode }[] = [
  { label: "Hôtel", icon: <Hotel className="w-4 h-4" /> },
  { label: "Gîte", icon: <House className="w-4 h-4" /> },
  { label: "Airbnb", icon: <Building className="w-4 h-4" /> },
  { label: "Camping", icon: <Tent className="w-4 h-4" /> },
  { label: "Résidence", icon: <Castle className="w-4 h-4" /> },
  { label: "Maison", icon: <Home className="w-4 h-4" /> },
  { label: "Autre", icon: <HelpCircle className="w-4 h-4" /> },
];

const STANDINGS: { label: string; icon: React.ReactNode }[] = [
  { label: "Budget", icon: <DollarSign className="w-4 h-4" /> },
  { label: "Moyen", icon: <Star className="w-4 h-4" /> },
  { label: "Haut", icon: <Crown className="w-4 h-4" /> },
  { label: "Luxe", icon: <Gem className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const SelectButton = ({ selected, label, onClick, icon }: { selected: boolean; label: string; onClick: () => void; icon?: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
      selected ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
    }`}
  >
    {icon}
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
          <SelectButton
            key={opt.label}
            selected={data.accommodationType === opt.label}
            label={opt.label}
            icon={opt.icon}
            onClick={() => update({ accommodationType: opt.label, accommodationTypeOther: opt.label !== "Autre" ? "" : data.accommodationTypeOther })}
          />
        ))}
      </div>
      {data.accommodationType === "Autre" && (
        <Input
          placeholder="Précisez le type d'hébergement..."
          value={data.accommodationTypeOther}
          onChange={(e) => update({ accommodationTypeOther: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground mt-2"
        />
      )}
    </div>

    <div className="space-y-2">
      <Label className="text-foreground font-semibold">Standing</Label>
      <div className="flex flex-wrap gap-2">
        {STANDINGS.map((opt) => (
          <SelectButton key={opt.label} selected={data.accommodationStanding === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ accommodationStanding: opt.label })} />
        ))}
      </div>
    </div>
  </div>
);

export default StepAccommodation;
