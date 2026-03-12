import { Label } from "@/components/ui/label";
import { Luggage } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const OPTIONS = [
  { value: "leger", label: "Voyage léger", desc: "Sac à dos uniquement" },
  { value: "cabine", label: "Bagage cabine", desc: "Valise cabine standard" },
  { value: "soute", label: "Bagage soute", desc: "Valise en soute" },
  { value: "plusieurs", label: "Plusieurs valises", desc: "Bagages multiples" },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepLuggage = ({ data, update }: Props) => {
  return (
    <div className="space-y-4">
      <Label className="text-foreground font-semibold">Logistique bagages</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => update({ luggageType: opt.value })}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
              data.luggageType === opt.value
                ? "gradient-button text-primary-foreground"
                : "glass-card text-foreground hover:bg-muted"
            }`}
          >
            <Luggage className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className={`text-xs ${data.luggageType === opt.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {opt.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepLuggage;
