// Edit every answer of the preparation questionnaire for one trip.
// Other saved trip details (from older forms) are kept as they are.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CountryCombobox from "@/components/prep/CountryCombobox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  STAY_TYPES, DURATION_BUCKETS, HOUSING_OPTIONS,
  answersFromTrip, buildTripFromAnswers, firstInvalidStep, validatePrepStep, type PrepAnswers,
} from "@/lib/prep-quiz";
import type { TravelFormData } from "@/types/travel";

export interface EditableTrip {
  id: string;
  title: string | null;
  destination: string | null;
  form_data?: unknown;
}

interface Props {
  trip: EditableTrip;
  open: boolean;
  setOpen: (v: boolean) => void;
  onUpdated?: () => void;
}

const PREP_FIELDS = [
  "destination", "arrivalCity", "departureLocation", "departureDate", "returnDate", "duration", "tripTypes",
  "totalBudget", "accommodationType", "nationality", "residence", "secondNationality", "stayType",
  "durationBucket", "budgetUnknown", "housing",
] as const;

const PrepTripEditDialog = ({ trip, open, setOpen, onUpdated }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [a, setA] = useState<PrepAnswers>(() => answersFromTrip(trip.form_data as Partial<TravelFormData>, trip.destination));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setA(answersFromTrip(trip.form_data as Partial<TravelFormData>, trip.destination));
      setError(null);
    }
  }, [open, trip]);

  const set = <K extends keyof PrepAnswers>(k: K, v: PrepAnswers[K]) => { setA((p) => ({ ...p, [k]: v })); setError(null); };

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`;

  const save = async () => {
    if (!user) return;
    const invalid = firstInvalidStep(a);
    if (invalid) { setError(t(validatePrepStep(invalid, a)!)); return; }
    setSaving(true);
    const built = buildTripFromAnswers(a, {
      tripType: a.stayType ? t(`prepQuiz.stay.${a.stayType}.title`) : "",
      accommodation: a.housing ? t(`prepQuiz.housing.${a.housing}`) : "",
    });
    const old = (trip.form_data as Record<string, unknown>) || {};
    const form: Record<string, unknown> = { ...old };
    for (const k of PREP_FIELDS) form[k] = built[k];
    const { error: upErr } = await supabase
      .from("trips")
      .update({
        title: t("index.tripTitle", { destination: built.destination }),
        destination: built.destination,
        arrival_city: built.arrivalCity,
        departure_location: built.departureLocation || null,
        departure_date: built.departureDate || null,
        return_date: built.returnDate || null,
        duration: built.duration ? parseInt(built.duration, 10) : null,
        form_data: form as never,
      })
      .eq("id", trip.id)
      .eq("user_id", user.id);
    setSaving(false);
    if (upErr) { toast.error(t("prepEdit.error")); return; }
    toast.success(t("prepEdit.saved"));
    setOpen(false);
    onUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{t("prepEdit.title")}</DialogTitle>
          <DialogDescription>{t("prepEdit.desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <CountryCombobox label={t("prepQuiz.destination.country")} value={a.destinationCode} onChange={(c) => set("destinationCode", c)} placeholder={t("prepQuiz.destination.countryPlaceholder")} />
            <div className="space-y-1.5">
              <Label htmlFor="pe-city">{t("prepQuiz.destination.city")}</Label>
              <Input id="pe-city" className="h-12 text-base" value={a.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <CountryCombobox label={t("prepQuiz.origin.nationality")} value={a.nationality} onChange={(c) => set("nationality", c)} />
            <CountryCombobox label={t("prepQuiz.origin.residence")} value={a.residence} onChange={(c) => set("residence", c)} />
            <CountryCombobox label={t("prepQuiz.origin.second")} value={a.secondNationality} onChange={(c) => set("secondNationality", c)} placeholder={t("prepQuiz.origin.secondPlaceholder")} />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("prepQuiz.stay.title")}</legend>
            <div className="flex flex-wrap gap-2">
              {STAY_TYPES.map((s) => (
                <button key={s} type="button" aria-pressed={a.stayType === s} onClick={() => set("stayType", s)} className={chip(a.stayType === s)}>{t(`prepQuiz.stay.${s}.title`)}</button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pe-dep">{t("prepQuiz.dates.departure")}</Label>
              <Input id="pe-dep" type="date" value={a.departureDate} onChange={(e) => set("departureDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pe-ret">{t("prepQuiz.dates.return")}</Label>
              <Input id="pe-ret" type="date" min={a.departureDate || undefined} value={a.returnDate} onChange={(e) => set("returnDate", e.target.value)} />
            </div>
          </div>
          {!(a.departureDate && a.returnDate) && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("prepQuiz.dates.bucketLegend")}</legend>
              <div className="flex flex-wrap gap-2">
                {DURATION_BUCKETS.map((b) => (
                  <button key={b} type="button" aria-pressed={a.durationBucket === b} onClick={() => set("durationBucket", a.durationBucket === b ? "" : b)} className={chip(a.durationBucket === b)}>{t(`prepQuiz.dates.bucket.${b}`)}</button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="pe-budget">{t("prepQuiz.budget.label")}</Label>
              <Input id="pe-budget" type="number" min={0} inputMode="numeric" disabled={a.budgetUnknown} value={a.budget} onChange={(e) => set("budget", e.target.value)} />
            </div>
            <button type="button" aria-pressed={a.budgetUnknown} onClick={() => set("budgetUnknown", !a.budgetUnknown)} className={chip(a.budgetUnknown)}>{t("prepQuiz.budget.unknown")}</button>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("prepQuiz.housing.title")}</legend>
            <div className="flex flex-wrap gap-2">
              {HOUSING_OPTIONS.map((h) => (
                <button key={h} type="button" aria-pressed={a.housing === h} onClick={() => set("housing", h)} className={chip(a.housing === h)}>{t(`prepQuiz.housing.${h}`)}</button>
              ))}
            </div>
          </fieldset>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={saving} className="gradient-button">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{t("prepEdit.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrepTripEditDialog;
