import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const CONSTRAINTS = [
  "Voyage avec enfant", "Voyage avec animal", "Régime alimentaire particulier",
  "Mobilité réduite", "Budget limité", "Temps limité"
];

const DIETARY = [
  "Végétarien", "Vegan", "Sans gluten", "Sans lactose", "Halal",
  "Kasher", "Sans porc", "Sans fruits de mer", "Sans noix", "Sans arachides"
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepConstraints = ({ data, update }: Props) => {
  const toggleConstraint = (opt: string) => {
    const current = data.constraints;
    update({
      constraints: current.includes(opt) ? current.filter((c) => c !== opt) : [...current, opt],
    });
  };

  const toggleDietary = (opt: string) => {
    const current = data.dietaryPreferences;
    update({
      dietaryPreferences: current.includes(opt) ? current.filter((d) => d !== opt) : [...current, opt],
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" /> Contraintes importantes
        </Label>
        <div className="flex flex-wrap gap-2">
          {CONSTRAINTS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleConstraint(opt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                data.constraints.includes(opt)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {data.constraints.includes("Voyage avec enfant") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Nombre d'enfants</Label>
          <Input
            type="number"
            min={1}
            value={data.childrenCount || ""}
            onChange={(e) => update({ childrenCount: parseInt(e.target.value) || 0 })}
            className="bg-muted border-border text-foreground w-32"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Éléments importants à savoir</Label>
        <Textarea
          placeholder="Peur de l'eau, vertige, phobies, préférences, contraintes particulières..."
          value={data.importantNotes}
          onChange={(e) => update({ importantNotes: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Régime alimentaire</Label>
        <div className="flex flex-wrap gap-2">
          {DIETARY.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleDietary(opt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
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

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Autre régime</Label>
        <Input
          placeholder="Précisez..."
          value={data.dietaryOther}
          onChange={(e) => update({ dietaryOther: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};

export default StepConstraints;
