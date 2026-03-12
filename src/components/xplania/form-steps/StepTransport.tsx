import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TravelFormData } from "@/types/travel";

const OPTIONS = ["avion", "train", "voiture", "bus", "mixte"];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepTransport = ({ data, update }: Props) => {
  const toggle = (opt: string) => {
    const current = data.transports;
    update({
      transports: current.includes(opt)
        ? current.filter((t) => t !== opt)
        : [...current, opt],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Mode de transport</Label>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                data.transports.includes(opt)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Préférence transport</Label>
        <Input
          placeholder="Ex : vol direct, classe éco, TGV..."
          value={data.transportPreference}
          onChange={(e) => update({ transportPreference: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};

export default StepTransport;
