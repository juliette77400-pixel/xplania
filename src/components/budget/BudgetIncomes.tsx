// Money coming in during the stay (Erasmus grant, internship pay, family help,
// other). Saved with the budget; added to the starting budget for the margin.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HandCoins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { BudgetIncomes as Incomes } from "@/lib/budget-math";

interface Props {
  incomes: Incomes;
  months: number;
  onChange: (next: Incomes) => void;
}

const FIELDS: Array<keyof Incomes> = ["grantMonthly", "payMonthly", "familyMonthly", "otherTotal"];

const BudgetIncomes = ({ incomes, months, onChange }: Props) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Record<keyof Incomes, string>>(() => toDraft(incomes));
  useEffect(() => { setDraft(toDraft(incomes)); }, [incomes]);
  const dirty = FIELDS.some((f) => (Math.max(0, Math.round(Number(draft[f]) || 0))) !== incomes[f]);

  const save = () => {
    const next = Object.fromEntries(FIELDS.map((f) => [f, Math.max(0, Math.round(Number(draft[f]) || 0))])) as unknown as Incomes;
    onChange(next);
  };

  return (
    <section aria-labelledby="budget-incomes-title" className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success" aria-hidden><HandCoins className="h-5 w-5" /></span>
        <div>
          <h2 id="budget-incomes-title" className="text-lg font-bold">{t("budget2.incomes.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("budget2.incomes.help")}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f} className="space-y-1.5">
            <Label htmlFor={`inc-${f}`}>{t(`budget2.incomes.${f}`)}</Label>
            <div className="relative">
              <Input id={`inc-${f}`} type="number" min={0} inputMode="numeric" value={draft[f]} placeholder="0"
                onChange={(e) => setDraft((d) => ({ ...d, [f]: e.target.value }))} className="pr-20" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{f === "otherTotal" ? "€" : t("budget2.sim.perMonth")}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{months >= 1 ? t("budget2.incomes.note", { months: months.toLocaleString() }) : t("budget2.incomes.noteShort")}</p>
        <Button size="sm" onClick={save} disabled={!dirty}>{t("budget2.incomes.save")}</Button>
      </div>
    </section>
  );
};

function toDraft(i: Incomes): Record<keyof Incomes, string> {
  return Object.fromEntries(FIELDS.map((f) => [f, i[f] ? String(i[f]) : ""])) as Record<keyof Incomes, string>;
}

export default BudgetIncomes;
