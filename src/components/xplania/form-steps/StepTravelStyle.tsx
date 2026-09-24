import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Compass, ClipboardList, Scale, Zap, Gauge, Snail, Activity } from "lucide-react";
import OptionButton from "./OptionButton";
import type { TravelFormData } from "@/types/travel";

const ORGANIZATION: { id: string; icon: React.ReactNode }[] = [
  { id: "Planifié", icon: <ClipboardList className="w-4 h-4" /> },
  { id: "Équilibré", icon: <Scale className="w-4 h-4" /> },
  { id: "Spontané", icon: <Zap className="w-4 h-4" /> },
];

const RHYTHM: { id: string; icon: React.ReactNode }[] = [
  { id: "Intensif", icon: <Gauge className="w-4 h-4" /> },
  { id: "Modéré", icon: <Activity className="w-4 h-4" /> },
  { id: "Tranquille", icon: <Snail className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}


const StepTravelStyle = ({ data, update }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" /> {t("travelForm.fields.organization")}
        </Label>
        <div className="flex flex-wrap gap-3">
          {ORGANIZATION.map((opt) => (
            <OptionButton large key={opt.id} selected={data.organization === opt.id} label={t(`travelForm.options.organization.${opt.id}`)} hint={t(`travelForm.optionHints.organization.${opt.id}`, { defaultValue: "" })} icon={opt.icon} onClick={() => update({ organization: opt.id })} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.rhythm")}</Label>
        <div className="flex flex-wrap gap-3">
          {RHYTHM.map((opt) => (
            <OptionButton large key={opt.id} selected={data.rhythm === opt.id} label={t(`travelForm.options.rhythm.${opt.id}`)} hint={t(`travelForm.optionHints.rhythm.${opt.id}`, { defaultValue: "" })} icon={opt.icon} onClick={() => update({ rhythm: opt.id })} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTravelStyle;
