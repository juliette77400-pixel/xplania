import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TravelFormData } from "@/types/travel";

const OPTIONS = [
  "aventure", "culture", "gastronomie", "nature", "plage",
  "road trip", "luxe", "slow travel", "digital nomad", "autre"
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepTripType = ({ data, update }: Props) => {
  const toggle = (opt: string) => {
    const current = data.tripTypes;
    update({
      tripTypes: current.includes(opt)
        ? current.filter((t) => t !== opt)
        : [...current, opt],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Type de voyage (choix multiples)</Label>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
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

      {data.tripTypes.includes("autre") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Précisez</Label>
          <Input
            placeholder="Décrivez votre type de voyage..."
            value={data.tripTypeOther}
            onChange={(e) => update({ tripTypeOther: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
};

export default StepTripType;
