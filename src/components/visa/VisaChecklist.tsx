// Personalised checklist of the Visa guide. Ticks are saved with the trip's
// analysis so they survive a reload.
import { useTranslation } from "react-i18next";
import { Check, ListChecks } from "lucide-react";
import ReliabilityBadge from "@/components/visa/ReliabilityBadge";
import type { ChecklistCategory, ChecklistPriority, VisaChecklistItem } from "@/lib/visa-rules";
import { cn } from "@/lib/utils";

const CATS: ChecklistCategory[] = ["documents", "health", "money", "practical"];
const PRIORITY_CLS: Record<ChecklistPriority, string> = {
  required: "bg-destructive/15 text-destructive",
  recommended: "bg-primary/15 text-primary",
  if_applicable: "bg-muted text-muted-foreground",
};
const ORDER: Record<ChecklistPriority, number> = { required: 0, recommended: 1, if_applicable: 2 };

interface Props {
  items: VisaChecklistItem[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}

const VisaChecklist = ({ items, checked, onToggle }: Props) => {
  const { t } = useTranslation();
  const done = items.filter((i) => checked[i.id]).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <section aria-labelledby="visa-checklist-title" className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-button" aria-hidden><ListChecks className="h-5 w-5 text-primary-foreground" /></span>
          <div>
            <h2 id="visa-checklist-title" className="text-lg font-bold">{t("visa2.checklist.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("visa2.checklist.progress", { done, total: items.length })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted/60" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("visa2.checklist.title")}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold text-primary">{pct}%</span>
        </div>
      </div>
      <p className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><ReliabilityBadge level="indicative" />{t("visa2.checklist.note")}</p>

      {CATS.map((cat) => {
        const list = items.filter((i) => i.category === cat).sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
        if (!list.length) return null;
        return (
          <div key={cat} className="mb-4 last:mb-0">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t(`visa2.checklist.cat.${cat}`)}</h3>
            <ul className="space-y-1.5">
              {list.map((item) => {
                const on = !!checked[item.id];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => onToggle(item.id)}
                      className={cn("flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors", on ? "border-primary/25 bg-primary/10" : "border-transparent bg-muted/30 hover:bg-muted/50")}
                    >
                      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2", on ? "border-primary bg-primary" : "border-muted-foreground/40")} aria-hidden>
                        {on && <Check className="h-3 w-3 text-primary-foreground" />}
                      </span>
                      <span className="flex-1">
                        <span className={cn("block text-sm font-medium", on && "line-through opacity-70")}>{item.item}</span>
                        {item.detail && <span className="block text-xs text-muted-foreground">{item.detail}</span>}
                        {item.condition && <span className="mt-0.5 block text-xs italic text-muted-foreground">{t("visa2.checklist.when", { condition: item.condition })}</span>}
                      </span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", PRIORITY_CLS[item.priority])}>{t(`visa2.checklist.priority.${item.priority}`)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
};

export default VisaChecklist;
