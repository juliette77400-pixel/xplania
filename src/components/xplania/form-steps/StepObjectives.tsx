import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const OBJECTIVES = [
  "Découvrir la culture locale", "Se reposer", "Explorer la nature",
  "Aventure / sensations", "Gastronomie", "Vie locale",
  "Photographie", "Spiritualité / bien-être", "Voyage slow / immersion"
];

const FEELINGS = [
  "Libre", "Inspiré", "Déconnecté", "Aventurier",
  "Curieux", "Social", "Calme", "Émerveillé"
];

const PRIORITIES = [
  "Découvrir des lieux uniques", "Éviter le stress", "Optimiser le budget",
  "Rencontrer des locaux", "Vivre des expériences immersives",
  "Découvrir la culture", "Explorer la nature", "Profiter du confort"
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const MultiSelect = ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (o: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onToggle(opt)}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          selected.includes(opt) ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const StepObjectives = ({ data, update }: Props) => {
  const toggle = (field: 'objectives' | 'feelings' | 'priorities', opt: string) => {
    const current = data[field];
    update({
      [field]: current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt],
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Objectif principal du voyage
        </Label>
        <MultiSelect options={OBJECTIVES} selected={data.objectives} onToggle={(o) => toggle('objectives', o)} />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Autre objectif</Label>
        <Input
          placeholder="Objectif particulier..."
          value={data.objectiveOther}
          onChange={(e) => update({ objectiveOther: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Comment voulez-vous vous sentir ?</Label>
        <MultiSelect options={FEELINGS} selected={data.feelings} onToggle={(o) => toggle('feelings', o)} />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Ce qui compte le plus pour vous</Label>
        <MultiSelect options={PRIORITIES} selected={data.priorities} onToggle={(o) => toggle('priorities', o)} />
      </div>
    </div>
  );
};

export default StepObjectives;
