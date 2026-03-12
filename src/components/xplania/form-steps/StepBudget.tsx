import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepBudget = ({ data, update }: Props) => {
  const days = data.dateMode === "duration"
    ? data.duration
    : data.departureDate && data.returnDate
      ? Math.max(1, Math.ceil((new Date(data.returnDate).getTime() - new Date(data.departureDate).getTime()) / 86400000))
      : 0;

  const perDay = days > 0 && data.totalBudget > 0 ? Math.round(data.totalBudget / days) : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Budget total estimé (€)</Label>
        <div className="relative">
          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            min={0}
            placeholder="Ex : 2000"
            value={data.totalBudget || ""}
            onChange={(e) => update({ totalBudget: parseInt(e.target.value) || 0 })}
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {perDay > 0 && (
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Budget par jour</p>
            <p className="text-2xl font-bold gradient-text">{perDay} €</p>
            <p className="text-xs text-muted-foreground">
              {data.totalBudget} € / {days} jours
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepBudget;
