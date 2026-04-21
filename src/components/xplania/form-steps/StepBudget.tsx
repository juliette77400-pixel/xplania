import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Home, Sparkles, UtensilsCrossed, Ticket, Map, Train } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const SPENDING_PRIORITIES: { id: string; icon: React.ReactNode }[] = [
  { id: "Hébergement", icon: <Home className="w-4 h-4" /> },
  { id: "Expériences", icon: <Sparkles className="w-4 h-4" /> },
  { id: "Restaurants", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "Activités", icon: <Ticket className="w-4 h-4" /> },
  { id: "Excursions", icon: <Map className="w-4 h-4" /> },
  { id: "Confort transport", icon: <Train className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepBudget = ({ data, update }: Props) => {
  const { t } = useTranslation();
  const durationDays = data.duration ? parseInt(data.duration) : 0;
  const perDay = durationDays > 0 && data.totalBudget > 0 ? Math.round(data.totalBudget / durationDays) : 0;

  const togglePriority = (opt: string) => {
    const current = data.spendingPriorities;
    update({
      spendingPriorities: current.includes(opt) ? current.filter((p) => p !== opt) : [...current, opt],
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" /> {t("travelForm.fields.totalBudget")}
        </Label>
        <Input
          type="number"
          min={0}
          value={data.totalBudget ? data.totalBudget : ""}
          onChange={(e) => {
            const v = e.target.value;
            update({ totalBudget: v === "" ? 0 : Math.max(0, parseInt(v) || 0) });
          }}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">{t("travelForm.fields.totalBudgetHint")}</p>
        {perDay > 0 && (
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("travelForm.fields.perDay")}</p>
              <p className="text-2xl font-bold gradient-text">{perDay} €</p>
              <p className="text-xs text-muted-foreground">{data.totalBudget} € / {t("travelForm.fields.days", { n: durationDays })}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.spendingPriorities")}</Label>
        <div className="flex flex-wrap gap-2">
          {SPENDING_PRIORITIES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => togglePriority(opt.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                data.spendingPriorities.includes(opt.id)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt.icon}
              {t(`travelForm.options.spending.${opt.id}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepBudget;
