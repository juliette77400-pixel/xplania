// Sends the chosen home's costs to the Budget guide, after an explicit confirmation.
// The accommodation line is replaced and the deposit kept apart, so repeating the
// action never counts the same home twice.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  applyHousingToBudget, budgetStorageKey, housingBudgetPlan, housingSyncKey, stayMonths,
  type BudgetCategoryLike, type HousingBudgetSync,
} from "@/lib/housing";
import { PREP_PROGRESS_EVENT } from "@/lib/prep-progress";
import type { HousingOption } from "@/hooks/useHousing";

interface BudgetState { hasGenerated?: boolean; categories?: BudgetCategoryLike[]; [k: string]: unknown }

export const readHousingSync = (tripId: string): HousingBudgetSync | null => {
  try { const raw = localStorage.getItem(housingSyncKey(tripId)); return raw ? JSON.parse(raw) : null; } catch { return null; }
};

const readBudget = (key: string): BudgetState | null => {
  try {
    const raw = localStorage.getItem(key);
    const s = raw ? (JSON.parse(raw) as BudgetState) : null;
    return s?.hasGenerated && Array.isArray(s.categories) && s.categories.length > 0 ? s : null;
  } catch { return null; }
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  option: HousingOption;
  tripId: string;
  destination: string;
  departureDate: string | null;
  durationDays: string | number | null;
  onSynced: () => void;
}

const HousingBudgetDialog = ({ open, onOpenChange, option, tripId, destination, departureDate, durationDays, onSynced }: Props) => {
  const { t, i18n } = useTranslation();
  const key = budgetStorageKey(destination, departureDate);
  const [budget, setBudget] = useState<BudgetState | null>(null);
  const [previous, setPrevious] = useState<HousingBudgetSync | null>(null);
  const [months, setMonths] = useState("");

  useEffect(() => {
    if (!open) return;
    setBudget(readBudget(key));
    setPrevious(readHousingSync(tripId));
    const m = stayMonths(durationDays);
    setMonths(m ? String(m) : "");
  }, [open, key, tripId, durationDays]);

  const fmt = (v: number) => new Intl.NumberFormat(i18n.language.startsWith("fr") ? "fr-FR" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
  const m = Math.round(Number(months));
  const validMonths = Number.isFinite(m) && m >= 1 && m <= 36;
  const plan = useMemo(() => housingBudgetPlan(option, validMonths ? m : 1), [option, validMonths, m]);
  const cat = (k: string) => Number(budget?.categories?.find((c) => c.key === k)?.planned) || 0;


  const confirm = () => {
    if (!budget?.categories || !validMonths) return;
    const categories = applyHousingToBudget(budget.categories, plan, previous);
    try {
      localStorage.setItem(key, JSON.stringify({ ...budget, categories, savedAt: Date.now() }));
      localStorage.setItem(housingSyncKey(tripId), JSON.stringify({ optionId: option.id, accommodation: plan.accommodation, deposit: plan.deposit, depositIn: "deposit" } satisfies HousingBudgetSync));
      window.dispatchEvent(new Event(PREP_PROGRESS_EVENT));
      toast.success(t("housing.budget.done"));
      onSynced();
      onOpenChange(false);
    } catch {
      toast.error(t("housing.budget.error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />{t("housing.budget.title")}</DialogTitle>
          <DialogDescription>{t("housing.budget.desc", { name: option.name })}</DialogDescription>
        </DialogHeader>

        {!budget ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{t("housing.budget.noBudget")}</p>
            <Button asChild className="gradient-button"><Link to="/guide-budget">{t("housing.budget.createBudget")}</Link></Button>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="hb-months">{t("housing.budget.months")}</Label>
              <Input id="hb-months" type="number" min={1} max={36} inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} className="w-32" />
              {!validMonths && <p role="alert" className="text-destructive">{t("housing.budget.monthsError")}</p>}
            </div>
            <dl className="divide-y divide-border/60 rounded-xl border border-border/60 bg-background/50">
              <div className="flex justify-between gap-3 px-3 py-2"><dt className="text-muted-foreground">{t("housing.budget.monthly")}</dt><dd className="font-semibold">{fmt(plan.monthly)} × {validMonths ? m : "?"}</dd></div>
              <div className="flex justify-between gap-3 px-3 py-2"><dt className="text-muted-foreground">{t("housing.budget.oneOff")}</dt><dd className="font-semibold">{fmt(plan.oneOff)}</dd></div>
              <div className="flex justify-between gap-3 px-3 py-2"><dt className="text-muted-foreground">{t("housing.budget.deposit")}</dt><dd className="font-semibold">{fmt(plan.deposit)}</dd></div>
            </dl>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
              <p className="font-semibold">{t("housing.budget.changesTitle")}</p>
              <p className="mt-1 text-muted-foreground">{t("housing.budget.accommodationLine", { before: fmt(cat("accommodation")), after: fmt(plan.accommodation) })}</p>
              <p className="text-muted-foreground">{t("housing.budget.depositLine", { before: fmt(cat("deposit")), after: fmt(plan.deposit) })}</p>
              {previous && previous.optionId !== option.id && <p className="mt-2 font-medium">{t("housing.budget.replacesOther")}</p>}
            </div>
            <p className="text-xs text-muted-foreground">{t("housing.budget.depositNote")}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          {budget && <Button className="gradient-button" disabled={!validMonths} onClick={confirm}>{previous ? t("housing.budget.confirmReplace") : t("housing.budget.confirm")}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HousingBudgetDialog;
