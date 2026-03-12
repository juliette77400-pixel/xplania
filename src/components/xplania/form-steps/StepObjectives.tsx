import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Globe, Palmtree, TreePine, Mountain, UtensilsCrossed, Users, Camera, Flame, Snail, Smile, Lightbulb, WifiOff, Footprints, Compass, Heart, Eye, Sparkles, Gem, Shield, Wallet, MapPin } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const OBJECTIVES: { label: string; icon: React.ReactNode }[] = [
  { label: "Découvrir la culture locale", icon: <Globe className="w-4 h-4" /> },
  { label: "Se reposer", icon: <Palmtree className="w-4 h-4" /> },
  { label: "Explorer la nature", icon: <TreePine className="w-4 h-4" /> },
  { label: "Aventure / sensations", icon: <Mountain className="w-4 h-4" /> },
  { label: "Gastronomie", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { label: "Vie locale", icon: <Users className="w-4 h-4" /> },
  { label: "Photographie", icon: <Camera className="w-4 h-4" /> },
  { label: "Spiritualité / bien-être", icon: <Flame className="w-4 h-4" /> },
  { label: "Voyage slow / immersion", icon: <Snail className="w-4 h-4" /> },
];

const FEELINGS: { label: string; icon: React.ReactNode }[] = [
  { label: "Libre", icon: <Footprints className="w-4 h-4" /> },
  { label: "Inspiré", icon: <Lightbulb className="w-4 h-4" /> },
  { label: "Déconnecté", icon: <WifiOff className="w-4 h-4" /> },
  { label: "Aventurier", icon: <Compass className="w-4 h-4" /> },
  { label: "Curieux", icon: <Eye className="w-4 h-4" /> },
  { label: "Social", icon: <Users className="w-4 h-4" /> },
  { label: "Calme", icon: <Heart className="w-4 h-4" /> },
  { label: "Émerveillé", icon: <Sparkles className="w-4 h-4" /> },
];

const PRIORITIES: { label: string; icon: React.ReactNode }[] = [
  { label: "Découvrir des lieux uniques", icon: <MapPin className="w-4 h-4" /> },
  { label: "Éviter le stress", icon: <Shield className="w-4 h-4" /> },
  { label: "Optimiser le budget", icon: <Wallet className="w-4 h-4" /> },
  { label: "Rencontrer des locaux", icon: <Users className="w-4 h-4" /> },
  { label: "Vivre des expériences immersives", icon: <Globe className="w-4 h-4" /> },
  { label: "Découvrir la culture", icon: <Gem className="w-4 h-4" /> },
  { label: "Explorer la nature", icon: <TreePine className="w-4 h-4" /> },
  { label: "Profiter du confort", icon: <Smile className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const IconButton = ({ selected, label, icon, onClick }: { selected: boolean; label: string; icon: React.ReactNode; onClick: () => void }) => (
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
        <div className="flex flex-wrap gap-2">
          {OBJECTIVES.map((opt) => (
            <IconButton key={opt.label} selected={data.objectives.includes(opt.label)} label={opt.label} icon={opt.icon} onClick={() => toggle('objectives', opt.label)} />
          ))}
        </div>
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
        <div className="flex flex-wrap gap-2">
          {FEELINGS.map((opt) => (
            <IconButton key={opt.label} selected={data.feelings.includes(opt.label)} label={opt.label} icon={opt.icon} onClick={() => toggle('feelings', opt.label)} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Ce qui compte le plus pour vous</Label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((opt) => (
            <IconButton key={opt.label} selected={data.priorities.includes(opt.label)} label={opt.label} icon={opt.icon} onClick={() => toggle('priorities', opt.label)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepObjectives;
