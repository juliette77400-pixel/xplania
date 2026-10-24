// Modules 3 and 4 — checks before signing and steps until moving in.
import { useTranslation } from "react-i18next";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SAFETY_ITEMS, INSTALL_PHASES, nextStatus, phasesForStatus, type HousingStatus } from "@/lib/housing";

interface ListProps {
  ids: string[];
  labelPrefix: string;
  checked: Set<string>;
  onToggle: (id: string, done: boolean) => void;
  disabled?: boolean;
}

const CheckList = ({ ids, labelPrefix, checked, onToggle, disabled }: ListProps) => {
  const { t } = useTranslation();
  return (
    <ul className="space-y-2">
      {ids.map((id) => {
        const short = id.split(":").pop()!;
        const isOn = checked.has(id);
        const htmlId = `hc-${id.replace(/:/g, "-")}`;
        return (
          <li key={id} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${isOn ? "border-primary/40 bg-primary/10" : "border-border/60 bg-background/50"}`}>
            <Checkbox id={htmlId} checked={isOn} disabled={disabled} onCheckedChange={(v) => onToggle(id, v === true)} className="mt-0.5" />
            <label htmlFor={htmlId} className={`flex-1 cursor-pointer text-sm ${isOn ? "text-muted-foreground line-through" : ""}`}>{t(`${labelPrefix}.${short}`)}</label>
          </li>
        );
      })}
    </ul>
  );
};

interface Props {
  checked: Set<string>;
  onToggle: (id: string, done: boolean) => void;
  disabled?: boolean;
}

/** With a confirmed home the checks are shown as reminders only (not counted). */
export const SafetyChecklist = ({ checked, onToggle, disabled, remindersOnly, status }: Props & { remindersOnly?: boolean; status: HousingStatus | null }) => {
  const { t } = useTranslation();
  const alerts = ["rush", "noContract", "contradictions", "transfer", "lowPrice", "noProof"];
  return (
    <div className="space-y-5">
      {remindersOnly ? (
        <p className="text-sm text-muted-foreground">{t(status === "confirmed" ? "housing.safety.confirmedNote" : "housing.safety.earlyNote")}</p>
      ) : (
        <CheckList ids={SAFETY_ITEMS.map((i) => `safety:${i}`)} labelPrefix="housing.safety.items" checked={checked} onToggle={onToggle} disabled={disabled} />
      )}
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold"><AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />{t("housing.safety.alertsTitle")}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {alerts.map((a) => <li key={a}>{t(`housing.safety.alerts.${a}`)}</li>)}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">{t("housing.safety.disclaimer")}</p>
    </div>
  );
};

export const InstallChecklist = ({ status, checked, onToggle, disabled, officialUrl, onNextStatus }: Props & { status: HousingStatus | null; officialUrl?: string; onNextStatus?: (s: HousingStatus) => void }) => {
  const { t } = useTranslation();
  const next = nextStatus(status);
  const showLegal = status === "shortlist" || status === "confirmed";
  return (
    <div className="space-y-5">
      {phasesForStatus(status).map((phase) => (
        <section key={phase} aria-labelledby={`phase-${phase}`}>
          <h3 id={`phase-${phase}`} className="mb-2 text-sm font-bold">{t(`housing.install.phases.${phase}`)}</h3>
          <CheckList
            ids={INSTALL_PHASES[phase].map((i) => `install:${phase}:${i}`)}
            labelPrefix={`housing.install.items.${phase}`}
            checked={checked}
            onToggle={onToggle}
            disabled={disabled}
          />
        </section>
      ))}
      {next && onNextStatus && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>{t(`housing.install.next.${next}`)}</span>
          <Button size="sm" variant="outline" onClick={() => onNextStatus(next)}>{t(`prepQuiz.housingStatus.${next}`)}</Button>
        </div>
      )}
      {showLegal && (
        <p className="text-xs text-muted-foreground">
          {t("housing.install.legal")}
          {officialUrl && (
            <> <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline">{t("housing.install.officialLink")}<ExternalLink className="h-3 w-3" aria-hidden /></a></>
          )}
        </p>
      )}
    </div>
  );
};
