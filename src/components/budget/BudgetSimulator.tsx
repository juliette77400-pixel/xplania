// "What if" simulator: monthly rent, monthly food and safety reserve. Nothing
// is saved until the student confirms the listed changes.
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import BudgetConfirmDialog from "@/components/budget/BudgetConfirmDialog";
import { changedLines, simulateBudget, simulatorDefaults, type BudgetLine, type SimulatorInput } from "@/lib/budget-math";
import { cn } from "@/lib/utils";

interface Props {
  lines: BudgetLine[];
  days: number;
  budget: number;
  onApply: (next: BudgetLine[]) => void;
}

const BudgetSimulator = ({ lines, days, budget, onApply }: Props) => {
  const { t } = useTranslation();
  const defaults = useMemo(() => simulatorDefaults(lines, days), [lines, days]);
  const [input, setInput] = useState<SimulatorInput>(defaults);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { setInput(defaults); }, [defaults]);

  // Untouched sliders must not "change" anything because of rounding.
  const untouched = input.accommodationMonthly === defaults.accommodationMonthly && input.foodMonthly === defaults.foodMonthly && input.reservePct === defaults.reservePct;
  const sim = useMemo(
    () => (untouched ? { lines, total: Math.round(lines.reduce((s, l) => s + l.planned, 0)) } : simulateBudget(lines, days, input)),
    [untouched, lines, days, input],
  );
  const changes = changedLines(lines, sim.lines);
  const current = lines.reduce((s, l) => s + l.planned, 0);
  const delta = sim.total - current;
  const margin = budget > 0 ? budget - sim.total : null;

  const field = (key: keyof SimulatorInput, max: number, step: number, unit: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label id={`sim-${key}`} className="font-medium">{t(`budget2.sim.${key}`)}</label>
        <span className="font-bold tabular-nums">{input[key]} {unit}</span>
      </div>
      <Slider aria-labelledby={`sim-${key}`} min={0} max={max} step={step} value={[input[key]]} onValueChange={([v]) => setInput((p) => ({ ...p, [key]: v }))} />
    </div>
  );

  return (
    <section aria-labelledby="budget-sim-title" className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary" aria-hidden><SlidersHorizontal className="h-5 w-5" /></span>
        <div>
          <h2 id="budget-sim-title" className="text-lg font-bold">{t("budget2.sim.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("budget2.sim.help")}</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {field("accommodationMonthly", Math.max(2000, defaults.accommodationMonthly * 2), 10, t("budget2.sim.perMonth"))}
        {field("foodMonthly", Math.max(1000, defaults.foodMonthly * 2), 10, t("budget2.sim.perMonth"))}
        {field("reservePct", 30, 1, "%")}
      </div>
      <div className="mt-5 flex flex-col gap-3 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
        <div className="text-sm">
          <p>{t("budget2.sim.newTotal")} <strong className="tabular-nums">{sim.total} €</strong> <span className={cn("tabular-nums", delta > 0 ? "text-destructive" : delta < 0 ? "text-success" : "text-muted-foreground")}>({delta > 0 ? "+" : ""}{delta} €)</span></p>
          {margin !== null && <p className={cn("text-xs", margin < 0 ? "text-destructive" : "text-muted-foreground")}>{margin < 0 ? t("budget2.sim.over", { amount: -margin }) : t("budget2.sim.left", { amount: margin })}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-auto min-h-9 whitespace-normal" onClick={() => setInput(defaults)} disabled={changes.length === 0}>{t("budget2.sim.reset")}</Button>
          <Button size="sm" className="h-auto min-h-9 whitespace-normal" onClick={() => setConfirm(true)} disabled={changes.length === 0}>{t("budget2.sim.apply")}</Button>
        </div>
      </div>
      <BudgetConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("budget2.sim.confirmTitle")}
        description={t("budget2.sim.confirmDesc")}
        changes={changes}
        confirmLabel={t("budget2.sim.apply")}
        onConfirm={() => { onApply(sim.lines); setConfirm(false); }}
      />
    </section>
  );
};

export default BudgetSimulator;
