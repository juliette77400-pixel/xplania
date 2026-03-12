import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Home, Sparkles, UtensilsCrossed, Ticket, Map, Train } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const SPENDING_PRIORITIES: { label: string; icon: React.ReactNode }[] = [
  { label: "Hébergement", icon: <Home className="w-4 h-4" /> },
  { label: "Expériences", icon: <Sparkles className="w-4 h-4" /> },
  { label: "Restaurants", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { label: "Activités", icon: <Ticket className="w-4 h-4" /> },
  { label: "Excursions", icon: <Map className="w-4 h-4" /> },
  { label: "Confort transport", icon: <Train className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepBudget = ({ data, update }: Props) => {
  const durationDays = data.duration ? parseInt(data.duration) : 0;
  const perDay = durationDays > 0 && data.totalBudget > 0
    ? Math.round(data.totalBudget / durationDays)
    : 0;

  const togglePriority = (opt: string) => {
    const current = data.spendingPriorities;
    update({
      spendingPriorities: current.includes(opt)
        ? current.filter((p) => p !== opt)
        : [...current, opt],
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" /> Budget approximatif (€)
        </Label>
        <Input
          type="number"
          min={0}
          placeholder="Ex : 2000"
          value={data.totalBudget || ""}
          onChange={(e) => update({ totalBudget: parseInt(e.target.value) || 0 })}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        {perDay > 0 && (
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Budget par jour</p>
              <p className="text-2xl font-bold gradient-text">{perDay} €</p>
              <p className="text-xs text-muted-foreground">{data.totalBudget} € / {durationDays} jours</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Priorité de dépense</Label>
        <div className="flex flex-wrap gap-2">
          {SPENDING_PRIORITIES.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => togglePriority(opt.label)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                data.spendingPriorities.includes(opt.label)
                  ? "gradient-button text-primary-foreground"
                  : "glass-card text-foreground hover:bg-muted"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepBudget;
