// ✨ NEW — Checklist "Avant le départ" avec cases à cocher persistées
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { useTripReminderChecks, REMINDER_ITEMS } from "@/hooks/useTripReminderChecks";
import { CheckCircle2 } from "lucide-react";

interface Props {
  tripId: string;
}

const TripReminderChecklist = ({ tripId }: Props) => {
  const { t } = useTranslation();
  const { done, toggle, loading, allDone } = useTripReminderChecks(tripId);

  if (loading) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-primary font-semibold flex items-center gap-1">
        {allDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        {t("reminders.checklistTitle")}
      </p>
      <ul className="space-y-1.5">
        {REMINDER_ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Checkbox
              id={`reminder-${tripId}-${item}`}
              checked={done.has(item)}
              onCheckedChange={(v) => toggle(item, v === true)}
            />
            <label
              htmlFor={`reminder-${tripId}-${item}`}
              className={`text-sm cursor-pointer ${done.has(item) ? "line-through text-muted-foreground" : ""}`}
            >
              {t(`reminders.items.${item}`)}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TripReminderChecklist;
