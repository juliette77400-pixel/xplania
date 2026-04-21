import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Hotel, Tent, Building, House, Castle, HelpCircle, Star, DollarSign, Crown, Gem } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TYPES: { id: string; icon: React.ReactNode }[] = [
  { id: "Hôtel", icon: <Hotel className="w-4 h-4" /> },
  { id: "Gîte", icon: <House className="w-4 h-4" /> },
  { id: "Airbnb", icon: <Building className="w-4 h-4" /> },
  { id: "Camping", icon: <Tent className="w-4 h-4" /> },
  { id: "Résidence", icon: <Castle className="w-4 h-4" /> },
  { id: "Maison", icon: <Home className="w-4 h-4" /> },
  { id: "Autre", icon: <HelpCircle className="w-4 h-4" /> },
];

const STANDINGS: { id: string; icon: React.ReactNode }[] = [
  { id: "Budget", icon: <DollarSign className="w-4 h-4" /> },
  { id: "Moyen", icon: <Star className="w-4 h-4" /> },
  { id: "Haut", icon: <Crown className="w-4 h-4" /> },
  { id: "Luxe", icon: <Gem className="w-4 h-4" /> },
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

const StepAccommodation = ({ data, update }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Home className="w-4 h-4 text-primary" /> {t("travelForm.fields.accommodationType")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((opt) => (
            <SelectButton
              key={opt.id}
              selected={data.accommodationType === opt.id}
              label={t(`travelForm.options.accommodation.${opt.id}`)}
              icon={opt.icon}
              onClick={() => update({ accommodationType: opt.id, accommodationTypeOther: opt.id !== "Autre" ? "" : data.accommodationTypeOther })}
            />
          ))}
        </div>
        {data.accommodationType === "Autre" && (
          <Input
            placeholder={t("travelForm.fields.accommodationOtherPh")}
            value={data.accommodationTypeOther}
            onChange={(e) => update({ accommodationTypeOther: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.standing")}</Label>
        <div className="flex flex-wrap gap-2">
          {STANDINGS.map((opt) => (
            <SelectButton key={opt.id} selected={data.accommodationStanding === opt.id} label={t(`travelForm.options.standing.${opt.id}`)} icon={opt.icon} onClick={() => update({ accommodationStanding: opt.id })} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepAccommodation;
