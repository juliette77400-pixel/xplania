import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Globe, Palmtree, TreePine, Mountain, UtensilsCrossed, Users, Camera, Flame, Snail, Smile, Lightbulb, WifiOff, Footprints, Compass, Heart, Eye, Sparkles, Gem, Shield, Wallet, MapPin } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const OBJECTIVES: { id: string; icon: React.ReactNode }[] = [
  { id: "Découvrir la culture locale", icon: <Globe className="w-4 h-4" /> },
  { id: "Se reposer", icon: <Palmtree className="w-4 h-4" /> },
  { id: "Explorer la nature", icon: <TreePine className="w-4 h-4" /> },
  { id: "Aventure / sensations", icon: <Mountain className="w-4 h-4" /> },
  { id: "Gastronomie", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "Vie locale", icon: <Users className="w-4 h-4" /> },
  { id: "Photographie", icon: <Camera className="w-4 h-4" /> },
  { id: "Spiritualité / bien-être", icon: <Flame className="w-4 h-4" /> },
  { id: "Voyage slow / immersion", icon: <Snail className="w-4 h-4" /> },
];

const FEELINGS: { id: string; icon: React.ReactNode }[] = [
  { id: "Libre", icon: <Footprints className="w-4 h-4" /> },
  { id: "Inspiré", icon: <Lightbulb className="w-4 h-4" /> },
  { id: "Déconnecté", icon: <WifiOff className="w-4 h-4" /> },
  { id: "Aventurier", icon: <Compass className="w-4 h-4" /> },
  { id: "Curieux", icon: <Eye className="w-4 h-4" /> },
  { id: "Social", icon: <Users className="w-4 h-4" /> },
  { id: "Calme", icon: <Heart className="w-4 h-4" /> },
  { id: "Émerveillé", icon: <Sparkles className="w-4 h-4" /> },
];

const PRIORITIES: { id: string; icon: React.ReactNode }[] = [
  { id: "Découvrir des lieux uniques", icon: <MapPin className="w-4 h-4" /> },
  { id: "Éviter le stress", icon: <Shield className="w-4 h-4" /> },
  { id: "Optimiser le budget", icon: <Wallet className="w-4 h-4" /> },
  { id: "Rencontrer des locaux", icon: <Users className="w-4 h-4" /> },
  { id: "Vivre des expériences immersives", icon: <Globe className="w-4 h-4" /> },
  { id: "Découvrir la culture", icon: <Gem className="w-4 h-4" /> },
  { id: "Explorer la nature", icon: <TreePine className="w-4 h-4" /> },
  { id: "Profiter du confort", icon: <Smile className="w-4 h-4" /> },
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
  const { t } = useTranslation();
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
          <Target className="w-4 h-4 text-primary" /> {t("travelForm.fields.objective")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVES.map((opt) => (
            <IconButton key={opt.id} selected={data.objectives.includes(opt.id)} label={t(`travelForm.options.objective.${opt.id}`)} icon={opt.icon} onClick={() => toggle('objectives', opt.id)} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.otherObjective")}</Label>
        <Input
          placeholder={t("travelForm.fields.otherObjectivePh")}
          value={data.objectiveOther}
          onChange={(e) => update({ objectiveOther: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.feelings")}</Label>
        <div className="flex flex-wrap gap-2">
          {FEELINGS.map((opt) => (
            <IconButton key={opt.id} selected={data.feelings.includes(opt.id)} label={t(`travelForm.options.feeling.${opt.id}`)} icon={opt.icon} onClick={() => toggle('feelings', opt.id)} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.priorities")}</Label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((opt) => (
            <IconButton key={opt.id} selected={data.priorities.includes(opt.id)} label={t(`travelForm.options.priority.${opt.id}`)} icon={opt.icon} onClick={() => toggle('priorities', opt.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepObjectives;
