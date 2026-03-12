import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TravelFormData } from "@/types/travel";

const OPTIONS = ["hotel", "auberge", "airbnb", "resort", "camping", "famille", "autre"];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepAccommodation = ({ data, update }: Props) => {
  const toggle = (opt: string) => {
    const current = data.accommodations;
    update({
      accommodations: current.includes(opt)
        ? current.filter((a) => a !== opt)
        : [...current, opt],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Type d'hébergement</Label>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                data.accommodations.includes(opt)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {data.accommodations.includes("autre") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Précisez</Label>
          <Input
            placeholder="Type d'hébergement souhaité..."
            value={data.accommodationOther}
            onChange={(e) => update({ accommodationOther: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
};

export default StepAccommodation;
