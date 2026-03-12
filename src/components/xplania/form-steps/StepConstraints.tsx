import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Baby, Dog, Utensils, Accessibility, Wallet, Timer, Leaf, Fish, Wheat, Milk, Moon, Star, Shell, Nut } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const CONSTRAINTS: { label: string; icon: React.ReactNode }[] = [
  { label: "Voyage avec enfant", icon: <Baby className="w-4 h-4" /> },
  { label: "Voyage avec animal", icon: <Dog className="w-4 h-4" /> },
  { label: "Régime alimentaire particulier", icon: <Utensils className="w-4 h-4" /> },
  { label: "Mobilité réduite", icon: <Accessibility className="w-4 h-4" /> },
  { label: "Budget limité", icon: <Wallet className="w-4 h-4" /> },
  { label: "Temps limité", icon: <Timer className="w-4 h-4" /> },
];

const DIETARY: { label: string; icon: React.ReactNode }[] = [
  { label: "Végétarien", icon: <Leaf className="w-4 h-4" /> },
  { label: "Vegan", icon: <Leaf className="w-4 h-4" /> },
  { label: "Sans gluten", icon: <Wheat className="w-4 h-4" /> },
  { label: "Sans lactose", icon: <Milk className="w-4 h-4" /> },
  { label: "Halal", icon: <Moon className="w-4 h-4" /> },
  { label: "Kasher", icon: <Star className="w-4 h-4" /> },
  { label: "Sans fruits de mer", icon: <Shell className="w-4 h-4" /> },
  { label: "Sans noix", icon: <Nut className="w-4 h-4" /> },
  { label: "Sans arachides", icon: <Nut className="w-4 h-4" /> },
  { label: "Sans cacahuète", icon: <Nut className="w-4 h-4" /> },
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
            <SelectButton
              key={opt.label}
              selected={data.constraints.includes(opt.label)}
              label={opt.label}
              icon={opt.icon}
              onClick={() => toggleConstraint(opt.label)}
            />
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

      {data.constraints.includes("Voyage avec animal") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Dog className="w-4 h-4 text-primary" /> Précisez l'animal (nature/taille)
          </Label>
          <Input
            placeholder="Ex : Chien de petite taille, chat..."
            value={data.animalDetails}
            onChange={(e) => update({ animalDetails: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {data.constraints.includes("Mobilité réduite") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-primary" /> Besoins spécifiques en assistance
          </Label>
          <Input
            placeholder="Ex : Fauteuil roulant, canne, assistance aéroport..."
            value={data.mobilityDetails}
            onChange={(e) => update({ mobilityDetails: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
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
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" /> Régime alimentaire
        </Label>
        <div className="flex flex-wrap gap-2">
          {DIETARY.map((opt) => (
            <SelectButton
              key={opt.label}
              selected={data.dietaryPreferences.includes(opt.label)}
              label={opt.label}
              icon={opt.icon}
              onClick={() => toggleDietary(opt.label)}
            />
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
