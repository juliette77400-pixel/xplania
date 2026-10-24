// Three recommendations computed from the student's own numbers (no AI).
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import type { Recommendation } from "@/lib/budget-math";
import { cn } from "@/lib/utils";

const ICON = { warn: AlertTriangle, info: Lightbulb, good: CheckCircle2 };
const CLS = { warn: "border-warning/30 bg-warning/5 text-warning", info: "border-primary/25 bg-primary/5 text-primary", good: "border-success/30 bg-success/5 text-success" };

const BudgetRecommendations = ({ items }: { items: Recommendation[] }) => {
  const { t } = useTranslation();
  if (!items.length) return null;
  return (
    <section aria-labelledby="budget-reco-title">
      <h2 id="budget-reco-title" className="mb-3 text-lg font-bold">{t("budget2.reco.title")}</h2>
      <ul className="grid gap-3 md:grid-cols-3">
        {items.map((r) => {
          const Icon = ICON[r.tone];
          const vars = { ...r.values, category: r.values.key ? t(`budget.categories.${r.values.key}`, { defaultValue: String(r.values.key) }) : "" };
          return (
            <li key={r.id} className={cn("rounded-2xl border p-4", CLS[r.tone])}>
              <Icon className="mb-2 h-5 w-5" aria-hidden />
              <p className="text-sm font-bold text-foreground">{t(`budget2.reco.${r.id}.title`, vars)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`budget2.reco.${r.id}.body`, vars)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default BudgetRecommendations;
