import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Baby, Dog, Accessibility, Wallet, Timer, Utensils, Leaf, Wheat, Milk, Moon, Star, Shell, Nut } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const CONSTRAINTS: { id: string; icon: React.ReactNode }[] = [
  { id: "Voyage avec enfant", icon: <Baby className="w-4 h-4" /> },
  { id: "Voyage avec animal", icon: <Dog className="w-4 h-4" /> },
  { id: "Mobilité réduite", icon: <Accessibility className="w-4 h-4" /> },
  { id: "Budget limité", icon: <Wallet className="w-4 h-4" /> },
  { id: "Temps limité", icon: <Timer className="w-4 h-4" /> },
];

const DIETARY: { id: string; icon: React.ReactNode }[] = [
  { id: "Végétarien", icon: <Leaf className="w-4 h-4" /> },
  { id: "Vegan", icon: <Leaf className="w-4 h-4" /> },
  { id: "Sans gluten", icon: <Wheat className="w-4 h-4" /> },
  { id: "Sans lactose", icon: <Milk className="w-4 h-4" /> },
  { id: "Halal", icon: <Moon className="w-4 h-4" /> },
  { id: "Kasher", icon: <Star className="w-4 h-4" /> },
  { id: "Sans fruits de mer", icon: <Shell className="w-4 h-4" /> },
  { id: "Sans noix", icon: <Nut className="w-4 h-4" /> },
  { id: "Sans arachides", icon: <Nut className="w-4 h-4" /> },
  { id: "Sans cacahuète", icon: <Nut className="w-4 h-4" /> },
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
  const { t } = useTranslation();
  const toggleConstraint = (opt: string) => {
    const current = data.constraints;
    update({ constraints: current.includes(opt) ? current.filter((c) => c !== opt) : [...current, opt] });
  };
  const toggleDietary = (opt: string) => {
    const current = data.dietaryPreferences;
    update({ dietaryPreferences: current.includes(opt) ? current.filter((d) => d !== opt) : [...current, opt] });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" /> {t("travelForm.fields.constraints")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {CONSTRAINTS.map((opt) => (
            <SelectButton
              key={opt.id}
              selected={data.constraints.includes(opt.id)}
              label={t(`travelForm.options.constraints.${opt.id}`)}
              icon={opt.icon}
              onClick={() => toggleConstraint(opt.id)}
            />
          ))}
        </div>
      </div>

      {data.constraints.includes("Voyage avec enfant") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{t("travelForm.fields.childrenCount")}</Label>
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
            <Dog className="w-4 h-4 text-primary" /> {t("travelForm.fields.animalDetails")}
          </Label>
          <Input
            placeholder={t("travelForm.fields.animalDetailsPh")}
            value={data.animalDetails}
            onChange={(e) => update({ animalDetails: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {data.constraints.includes("Mobilité réduite") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-primary" /> {t("travelForm.fields.mobilityDetails")}
          </Label>
          <Input
            placeholder={t("travelForm.fields.mobilityDetailsPh")}
            value={data.mobilityDetails}
            onChange={(e) => update({ mobilityDetails: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {data.constraints.includes("Budget limité") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" /> {t("travelForm.fields.budgetDetails")}
          </Label>
          <Input
            placeholder={t("travelForm.fields.budgetDetailsPh")}
            value={data.budgetDetails}
            onChange={(e) => update({ budgetDetails: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {data.constraints.includes("Temps limité") && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" /> {t("travelForm.fields.timeDetails")}
          </Label>
          <Input
            placeholder={t("travelForm.fields.timeDetailsPh")}
            value={data.timeDetails}
            onChange={(e) => update({ timeDetails: e.target.value })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.importantNotes")}</Label>
        <Textarea
          placeholder={t("travelForm.fields.importantNotesPh")}
          value={data.importantNotes}
          onChange={(e) => update({ importantNotes: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" /> {t("travelForm.fields.diet")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {DIETARY.map((opt) => (
            <SelectButton
              key={opt.id}
              selected={data.dietaryPreferences.includes(opt.id)}
              label={t(`travelForm.options.diet.${opt.id}`)}
              icon={opt.icon}
              onClick={() => toggleDietary(opt.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.otherDiet")}</Label>
        <Input
          placeholder={t("travelForm.fields.otherDietPh")}
          value={data.dietaryOther}
          onChange={(e) => update({ dietaryOther: e.target.value })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};

export default StepConstraints;
