import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Heart, Users, Home, Briefcase } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TYPES = [
  { value: "solo", label: "Solo", icon: User },
  { value: "couple", label: "Couple", icon: Heart },
  { value: "amis", label: "Amis", icon: Users },
  { value: "famille", label: "Famille", icon: Home },
  { value: "business", label: "Business", icon: Briefcase },
] as const;

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepTravelers = ({ data, update }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Nombre de voyageurs</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={data.travelerCount}
          onChange={(e) => update({ travelerCount: parseInt(e.target.value) || 1 })}
          className="bg-muted border-border text-foreground w-32"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Type de voyage</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => update({ travelerType: t.value })}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left ${
                data.travelerType === t.value
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTravelers;
