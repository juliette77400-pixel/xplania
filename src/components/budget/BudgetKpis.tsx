// Five budget indicators + one-off / monthly / whole-stay split.
import { useTranslation } from "react-i18next";
import type { BudgetSummary } from "@/lib/budget-math";
import { cn } from "@/lib/utils";

const eur = (n: number, lang: string) =>
  new Intl.NumberFormat(lang.startsWith("fr") ? "fr-FR" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const BudgetKpis = ({ summary }: { summary: BudgetSummary }) => {
  const { t, i18n } = useTranslation();
  const l = i18n.language;
  const marginTone = summary.margin === null ? "" : summary.margin < 0 ? "text-destructive" : "text-success";

  const tiles: Array<{ id: string; label: string; value: string; hint: string; cls?: string }> = [
    { id: "budget", label: t("budget2.kpi.budget"), value: summary.budget ? eur(summary.budget, l) : t("budget2.kpi.notGiven"), hint: t("budget2.kpi.budgetHint") },
    { id: "estimated", label: t("budget2.kpi.estimated"), value: eur(summary.estimated, l), hint: t("budget2.kpi.estimatedHint") },
    { id: "paid", label: t("budget2.kpi.paid"), value: eur(summary.paid, l), hint: t("budget2.kpi.paidHint") },
    { id: "toPay", label: t("budget2.kpi.toPay"), value: eur(summary.toPay, l), hint: t("budget2.kpi.toPayHint") },
    { id: "margin", label: t("budget2.kpi.margin"), value: summary.margin === null ? "—" : eur(summary.margin, l), hint: summary.margin === null ? t("budget2.kpi.marginNoBudget") : summary.margin < 0 ? t("budget2.kpi.marginOver") : t("budget2.kpi.marginOk"), cls: marginTone },
  ];

  return (
    <section aria-labelledby="budget-kpi-title" className="space-y-3">
      <h2 id="budget-kpi-title" className="sr-only">{t("budget2.kpi.title")}</h2>
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
          <p className="text-lg font-bold tabular-nums">{eur(summary.oneOff, l)}</p>
          <p className="text-[11px] text-muted-foreground">{t("budget2.split.oneOffHint")}</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("budget2.split.monthly")}</p>
          <p className="text-lg font-bold tabular-nums">{summary.monthly === null ? "—" : eur(summary.monthly, l)}</p>
          <p className="text-[11px] text-muted-foreground">{summary.monthly === null ? t("budget2.split.shortStay") : t("budget2.split.monthlyHint", { months: summary.months.toLocaleString(l.startsWith("fr") ? "fr-FR" : "en-GB") })}</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("budget2.split.total")}</p>
          <p className="text-lg font-bold tabular-nums">{eur(summary.estimated, l)}</p>
          <p className="text-[11px] text-muted-foreground">{t("budget2.split.totalHint")}</p>
        </div>
      </div>
    </section>
  );
};

export default BudgetKpis;
