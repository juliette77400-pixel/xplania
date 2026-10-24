// "Is this home right for my budget and my stay?" — forgotten costs, dates,
// commute and scam signs for one saved home. Never says a listing is safe.
import { useTranslation } from "react-i18next";
import { AlertOctagon, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { housingFit, stayTotalCost, type FitContext, type FitTone } from "@/lib/housing";
import type { HousingOption } from "@/hooks/useHousing";
import { cn } from "@/lib/utils";

const ICON: Record<FitTone, typeof HelpCircle> = { danger: AlertOctagon, warn: AlertTriangle, check: HelpCircle, ok: CheckCircle2 };
const CLS: Record<FitTone, string> = {
  danger: "border-destructive/40 bg-destructive/10",
  warn: "border-warning/40 bg-warning/10",
  check: "border-border bg-muted/30",
  ok: "border-success/30 bg-success/10",
};
const ICON_CLS: Record<FitTone, string> = { danger: "text-destructive", warn: "text-warning", check: "text-muted-foreground", ok: "text-success" };

interface Props {
  option: HousingOption | null;
  ctx: FitContext;
  months: number;
  onOpenChange: (v: boolean) => void;
}

const HousingFitDialog = ({ option, ctx, months, onOpenChange }: Props) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-GB";
  const fmt = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  if (!option) return null;
  const fit = housingFit(option, ctx);
  const vars = (v?: Record<string, string | number>) => {
    if (!v) return {};
    const out: Record<string, string | number> = { ...v };
    for (const k of ["monthly", "max", "diff"]) if (typeof v[k] === "number") out[k] = fmt(v[k] as number);
    if (typeof v.date === "string") out.date = fmtDate(v.date);
    return out;
  };

  return (
    <Dialog open={!!option} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("housing.fit.title", { name: option.name })}</DialogTitle>
          <DialogDescription>{t("housing.fit.desc")}</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-muted/30 p-3 text-sm">
          <p>{t("housing.fit.total", { months, total: fmt(stayTotalCost(option, months)) })}</p>
          {option.deposit != null && option.deposit > 0 && <p className="text-xs text-muted-foreground">{t("housing.fit.depositApart", { amount: fmt(option.deposit) })}</p>}
        </div>
        <ul className="space-y-2">
          {fit.points.map((p) => {
            const Icon = ICON[p.tone];
            return (
              <li key={p.id} className={cn("flex gap-3 rounded-xl border p-3 text-sm", CLS[p.tone])}>
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", ICON_CLS[p.tone])} aria-hidden />
                <span>
                  <span className="block font-semibold">{t(`housing.fit.points.${p.id}.title`, vars(p.vars))}</span>
                  <span className="block text-xs text-muted-foreground">{t(`housing.fit.points.${p.id}.body`, vars(p.vars))}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">{t("housing.fit.disclaimer")}</p>
      </DialogContent>
    </Dialog>
  );
};

export default HousingFitDialog;
