// Five budget indicators, the first month, and costs before / each month / at the end.
import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";
import type { BudgetSummary } from "@/lib/budget-math";
import { cn } from "@/lib/utils";

const eur = (n: number, lang: string) =>
  new Intl.NumberFormat(lang.startsWith("fr") ? "fr-FR" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const BudgetKpis = ({ summary }: { summary: BudgetSummary }) => {
  const { t, i18n } = useTranslation();
  const l = i18n.language;
  const marginTone = summary.margin === null ? "" : summary.margin < 0 ? "text-destructive" : "text-success";
  const monthsTxt = summary.months.toLocaleString(l.startsWith("fr") ? "fr-FR" : "en-GB");
  const firstTight = summary.budget > 0 && summary.firstMonth > summary.budget;

  const tiles: Array<{ id: string; label: string; value: string; hint: string; cls?: string }> = [
    {
      id: "resources",
      label: t("budget2.kpi.resources"),
      value: summary.resources ? eur(summary.resources, l) : t("budget2.kpi.notGiven"),
      hint: summary.incomeTotal > 0
        ? t("budget2.kpi.resourcesHint", { budget: eur(summary.budget, l), income: eur(summary.incomeTotal, l) })
        : t("budget2.kpi.budgetHint"),
    },
    { id: "estimated", label: t("budget2.kpi.estimated"), value: eur(summary.estimated, l), hint: t("budget2.kpi.estimatedHint") },
    { id: "paid", label: t("budget2.kpi.paid"), value: eur(summary.paid, l), hint: t("budget2.kpi.paidHint") },
    { id: "toPay", label: t("budget2.kpi.toPay"), value: eur(summary.toPay, l), hint: t("budget2.kpi.toPayHint") },
    { id: "margin", label: t("budget2.kpi.margin"), value: summary.margin === null ? "—" : eur(summary.margin, l), hint: summary.margin === null ? t("budget2.kpi.marginNoBudget") : summary.margin < 0 ? t("budget2.kpi.marginOver") : t("budget2.kpi.marginOk"), cls: marginTone },
  ];

  return (
    <section aria-labelledby="budget-kpi-title" className="space-y-3">
      <h2 id="budget-kpi-title" className="sr-only">{t("budget2.kpi.title")}</h2>

      {summary.months >= 1 && (
        <div className={cn("rounded-2xl border p-5", firstTight ? "border-warning/40 bg-warning/10" : "border-primary/25 bg-primary/5")}>
          <p className="flex items-center gap-2 text-sm font-semibold"><CalendarClock className="h-4 w-4 text-primary" aria-hidden />{t("budget2.first.title")}</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{eur(summary.firstMonth, l)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("budget2.first.detail", { before: eur(summary.before, l), month: eur(summary.monthly ?? 0, l) })}
            {summary.deposit > 0 && <> {t("budget2.first.deposit", { amount: eur(summary.deposit, l) })}</>}
          </p>
          {firstTight && <p className="mt-2 text-xs font-semibold text-warning">{t("budget2.first.tight", { missing: eur(summary.firstMonth - summary.budget, l) })}</p>}
          {summary.incomeMonthly > 0 && <p className="mt-1 text-xs text-muted-foreground">{t("budget2.first.incomeNote", { amount: eur(summary.incomeMonthly, l) })}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map((k) => (
          <div key={k.id} className={cn("rounded-2xl border border-border/70 bg-card/60 p-4", k.id === "margin" && "col-span-2 md:col-span-1")}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className={cn("mt-1 text-xl font-extrabold tabular-nums", k.cls)}>{k.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{k.hint}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("budget2.split.oneOff")}</p>
          <p className="text-lg font-bold tabular-nums">{eur(summary.before, l)}</p>
          <p className="text-[11px] text-muted-foreground">{t("budget2.split.oneOffHint")}</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("budget2.split.monthly")}</p>
          <p className="text-lg font-bold tabular-nums">{summary.monthly === null ? "—" : eur(summary.monthly, l)}</p>
          <p className="text-[11px] text-muted-foreground">{summary.monthly === null ? t("budget2.split.shortStay") : t("budget2.split.monthlyHint", { months: monthsTxt })}</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("budget2.split.end")}</p>
          <p className="text-lg font-bold tabular-nums">{eur(summary.end, l)}</p>
          <p className="text-[11px] text-muted-foreground">{t("budget2.split.endHint", { total: eur(summary.estimated, l) })}</p>
        </div>
      </div>
    </section>
  );
};

export default BudgetKpis;
