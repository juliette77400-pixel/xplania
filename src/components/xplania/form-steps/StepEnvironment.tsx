import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, CloudSun, WifiOff, Signal, SignalHigh, Thermometer, Snowflake, Sun, TreePalm, Leaf, Globe, Backpack, Luggage, BriefcaseBusiness, Mountain, Camera, HelpCircle } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const CONNECTIVITY: { label: string; icon: React.ReactNode }[] = [
  { label: "Aucune", icon: <WifiOff className="w-4 h-4" /> },
  { label: "Faible", icon: <Signal className="w-4 h-4" /> },
  { label: "Moyenne", icon: <SignalHigh className="w-4 h-4" /> },
  { label: "Bonne", icon: <Wifi className="w-4 h-4" /> },
];

const CLIMATE: { label: string; icon: React.ReactNode }[] = [
  { label: "Chaud", icon: <Sun className="w-4 h-4" /> },
  { label: "Froid", icon: <Snowflake className="w-4 h-4" /> },
  { label: "Moyen", icon: <Thermometer className="w-4 h-4" /> },
  { label: "Tropical", icon: <TreePalm className="w-4 h-4" /> },
];

const ENV_SENSITIVITY: { label: string; icon: React.ReactNode }[] = [
  { label: "Faible", icon: <Leaf className="w-4 h-4" /> },
  { label: "Moyenne", icon: <Leaf className="w-4 h-4" /> },
  { label: "Forte", icon: <Leaf className="w-4 h-4" /> },
];

const CULTURAL_IMMERSION: { label: string; icon: React.ReactNode }[] = [
  { label: "Oui", icon: <Globe className="w-4 h-4" /> },
  { label: "Non", icon: <Globe className="w-4 h-4" /> },
  { label: "Je ne sais pas", icon: <HelpCircle className="w-4 h-4" /> },
];

const BAGGAGE_TYPES: { label: string; icon: React.ReactNode }[] = [
  { label: "Sac à dos", icon: <Backpack className="w-4 h-4" /> },
  { label: "Valise cabine", icon: <Luggage className="w-4 h-4" /> },
  { label: "Valise soute", icon: <Luggage className="w-4 h-4" /> },
  { label: "Sac de randonnée", icon: <Mountain className="w-4 h-4" /> },
  { label: "Sac photo", icon: <Camera className="w-4 h-4" /> },
  { label: "Sac professionnel", icon: <BriefcaseBusiness className="w-4 h-4" /> },
  { label: "Autre", icon: <HelpCircle className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const SelectButton = ({ selected, label, onClick, icon }: { selected: boolean; label: string; onClick: () => void; icon?: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
      selected ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
    }`}
  >
    {icon}
    {label}
  </button>
);

const StepEnvironment = ({ data, update }: Props) => {
  const baggageTypes = data.baggageTypes || [];
  const toggleBaggage = (opt: string) => {
    update({
      baggageTypes: baggageTypes.includes(opt) ? baggageTypes.filter((b) => b !== opt) : [...baggageTypes, opt],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" /> Connectivité souhaitée
        </Label>
        <div className="flex flex-wrap gap-3">
          {CONNECTIVITY.map((opt) => (
            <SelectButton key={opt.label} selected={data.connectivity === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ connectivity: opt.label })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <CloudSun className="w-4 h-4 text-primary" /> Préférence climatique
        </Label>
        <div className="flex flex-wrap gap-3">
          {CLIMATE.map((opt) => (
            <SelectButton key={opt.label} selected={data.climatePreference === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ climatePreference: opt.label })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Leaf className="w-4 h-4 text-primary" /> Sensibilité environnementale
        </Label>
        <div className="flex flex-wrap gap-3">
          {ENV_SENSITIVITY.map((opt) => (
            <SelectButton key={opt.label} selected={data.environmentalSensitivity === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ environmentalSensitivity: opt.label })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Souhaitez-vous vivre une immersion culturelle ?
        </Label>
        <div className="flex flex-wrap gap-3">
          {CULTURAL_IMMERSION.map((opt) => (
            <SelectButton key={opt.label} selected={data.culturalImmersion === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ culturalImmersion: opt.label })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Luggage className="w-4 h-4 text-primary" /> Type de bagage
        </Label>
        <div className="flex flex-wrap gap-3">
          {BAGGAGE_TYPES.map((opt) => (
            <SelectButton key={opt.label} selected={baggageTypes.includes(opt.label)} label={opt.label} icon={opt.icon} onClick={() => toggleBaggage(opt.label)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepEnvironment;
