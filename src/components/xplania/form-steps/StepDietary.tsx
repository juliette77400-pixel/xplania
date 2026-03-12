import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TravelFormData } from "@/types/travel";

const OPTIONS = [
  "aucune restriction", "végétarien", "vegan", "halal", "sans gluten", "autre"
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepDietary = ({ data, update }: Props) => {
  const toggle = (opt: string) => {
    const current = data.dietaryPreferences;
    update({
      dietaryPreferences: current.includes(opt)
        ? current.filter((d) => d !== opt)
        : [...current, opt],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Préférences alimentaires</Label>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                data.dietaryPreferences.includes(opt)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {data.dietaryPreferences.includes("autre") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Précisez</Label>
          <Input
            placeholder="Restrictions alimentaires..."
            value={data.dietaryOther}
            onChange={(e) => update({ dietaryOther: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
};

export default StepDietary;
