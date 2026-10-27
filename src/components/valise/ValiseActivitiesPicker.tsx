// "What will you do there?" — multi-select + one custom activity, saved with the trip.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VALISE_ACTIVITIES, type ValiseActivity } from "@/lib/valise-activities";

const EMOJI: Record<ValiseActivity, string> = {
  study: "🎓", internship: "💼", hiking: "🥾", beach: "🏖️", sport: "⚽", nightlife: "🎉", culture: "🏛️", excursions: "🗺️",
};

interface Props {
  value: ValiseActivity[];
  other: string;
  saving?: boolean;
  onChange: (next: ValiseActivity[], other: string) => void;
}

const ValiseActivitiesPicker = ({ value, other, saving, onChange }: Props) => {
  const { t } = useTranslation();
  const [draftOther, setDraftOther] = useState(other);
  useEffect(() => setDraftOther(other), [other]);

  const toggle = (a: ValiseActivity) =>
    onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a], draftOther);

  return (
    <section aria-labelledby="valise-activities-title" className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="valise-activities-title" className="text-base font-bold text-foreground sm:text-lg">{t("valise3.activities.title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t("valise3.activities.subtitle")}</p>
        </div>
        {saving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label={t("housing.saving")} />}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {VALISE_ACTIVITIES.map((a) => {
          const on = value.includes(a);
          return (
            <button
              key={a}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(a)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${on ? "border-primary bg-primary/15 text-foreground" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
            >
              <span aria-hidden>{EMOJI[a]}</span>
              <span className="flex-1">{t(`valise3.activities.items.${a}`)}</span>
              {on && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 max-w-sm space-y-1.5">
        <Label htmlFor="valise-other-activity" className="text-xs">{t("valise3.activities.other")}</Label>
        <Input
          id="valise-other-activity"
          maxLength={60}
          value={draftOther}
          placeholder={t("valise3.activities.otherPlaceholder")}
          onChange={(e) => setDraftOther(e.target.value)}
          onBlur={() => { if (draftOther.trim() !== other.trim()) onChange(value, draftOther.trim()); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        />
      </div>
    </section>
  );
};

export default ValiseActivitiesPicker;
