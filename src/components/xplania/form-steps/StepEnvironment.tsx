import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Wifi, CloudSun, WifiOff, Signal, SignalHigh, Thermometer, Snowflake, Sun, TreePalm, Leaf, Globe, Backpack, Luggage, BriefcaseBusiness, Mountain, Camera, HelpCircle } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const CONNECTIVITY: { id: string; icon: React.ReactNode }[] = [
  { id: "Aucune", icon: <WifiOff className="w-4 h-4" /> },
  { id: "Faible", icon: <Signal className="w-4 h-4" /> },
  { id: "Moyenne", icon: <SignalHigh className="w-4 h-4" /> },
  { id: "Bonne", icon: <Wifi className="w-4 h-4" /> },
];

const CLIMATE: { id: string; icon: React.ReactNode }[] = [
  { id: "Chaud", icon: <Sun className="w-4 h-4" /> },
  { id: "Froid", icon: <Snowflake className="w-4 h-4" /> },
  { id: "Moyen", icon: <Thermometer className="w-4 h-4" /> },
  { id: "Tropical", icon: <TreePalm className="w-4 h-4" /> },
];

const ENV_SENSITIVITY: { id: string; icon: React.ReactNode }[] = [
  { id: "Faible", icon: <Leaf className="w-4 h-4" /> },
  { id: "Moyenne", icon: <Leaf className="w-4 h-4" /> },
  { id: "Forte", icon: <Leaf className="w-4 h-4" /> },
];

const CULTURAL_IMMERSION: { id: string; tk: string; icon: React.ReactNode }[] = [
  { id: "Oui", tk: "yes", icon: <Globe className="w-4 h-4" /> },
  { id: "Non", tk: "no", icon: <Globe className="w-4 h-4" /> },
  { id: "Je ne sais pas", tk: "dontKnow", icon: <HelpCircle className="w-4 h-4" /> },
];

const BAGGAGE_TYPES: { id: string; icon: React.ReactNode }[] = [
  { id: "Sac à dos", icon: <Backpack className="w-4 h-4" /> },
  { id: "Valise cabine", icon: <Luggage className="w-4 h-4" /> },
  { id: "Valise soute", icon: <Luggage className="w-4 h-4" /> },
  { id: "Sac de randonnée", icon: <Mountain className="w-4 h-4" /> },
  { id: "Sac photo", icon: <Camera className="w-4 h-4" /> },
  { id: "Sac professionnel", icon: <BriefcaseBusiness className="w-4 h-4" /> },
  { id: "Autre", icon: <HelpCircle className="w-4 h-4" /> },
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
  const { t } = useTranslation();
  const baggageTypes = data.baggageTypes || [];
  const toggleBaggage = (opt: string) => {
    update({ baggageTypes: baggageTypes.includes(opt) ? baggageTypes.filter((b) => b !== opt) : [...baggageTypes, opt] });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" /> {t("travelForm.fields.connectivity")}
        </Label>
        <div className="flex flex-wrap gap-3">
          {CONNECTIVITY.map((opt) => (
            <SelectButton key={opt.id} selected={data.connectivity === opt.id} label={t(`travelForm.options.connectivity.${opt.id}`)} icon={opt.icon} onClick={() => update({ connectivity: opt.id })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <CloudSun className="w-4 h-4 text-primary" /> {t("travelForm.fields.climate")}
        </Label>
        <div className="flex flex-wrap gap-3">
          {CLIMATE.map((opt) => (
            <SelectButton key={opt.id} selected={data.climatePreference === opt.id} label={t(`travelForm.options.climate.${opt.id}`)} icon={opt.icon} onClick={() => update({ climatePreference: opt.id })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Leaf className="w-4 h-4 text-primary" /> {t("travelForm.fields.envSensitivity")}
        </Label>
        <div className="flex flex-wrap gap-3">
          {ENV_SENSITIVITY.map((opt) => (
            <SelectButton key={opt.id} selected={data.environmentalSensitivity === opt.id} label={t(`travelForm.options.envSensitivity.${opt.id}`)} icon={opt.icon} onClick={() => update({ environmentalSensitivity: opt.id })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> {t("travelForm.fields.culturalImmersion")}
        </Label>
        <div className="flex flex-wrap gap-3">
          {CULTURAL_IMMERSION.map((opt) => (
            <SelectButton key={opt.id} selected={data.culturalImmersion === opt.id} label={t(`travelForm.options.${opt.tk}`)} icon={opt.icon} onClick={() => update({ culturalImmersion: opt.id })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Luggage className="w-4 h-4 text-primary" /> {t("travelForm.fields.baggageType")}
        </Label>
        <div className="flex flex-wrap gap-3">
          {BAGGAGE_TYPES.map((opt) => (
            <SelectButton key={opt.id} selected={baggageTypes.includes(opt.id)} label={t(`travelForm.options.baggage.${opt.id}`)} icon={opt.icon} onClick={() => toggleBaggage(opt.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepEnvironment;
