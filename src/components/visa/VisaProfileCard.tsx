// "Ton profil" block of the Visa guide: shows the answers used for the
// analysis, flags the missing ones and lets the student complete them here.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil, Save, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CountryCombobox from "@/components/prep/CountryCombobox";
import { STAY_TYPES, DURATION_BUCKETS } from "@/lib/prep-quiz";
import { PASSPORT_TYPES, countryLabel, missingVisaFields, visaStayDays, type VisaField, type VisaProfile } from "@/lib/visa-rules";
import { cn } from "@/lib/utils";

interface Props {
  profile: VisaProfile;
  saving: boolean;
  onSave: (next: VisaProfile) => Promise<boolean>;
}

const chip = (active: boolean) =>
  cn("rounded-xl border px-3 py-2 text-sm transition-colors", active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground");

const VisaProfileCard = ({ profile, saving, onSave }: Props) => {
  const { t } = useTranslation();
  const missing = missingVisaFields(profile);
  const [editing, setEditing] = useState(missing.length > 0);
  const [draft, setDraft] = useState<VisaProfile>(profile);
  const [transitPick, setTransitPick] = useState("");

  useEffect(() => { setDraft(profile); }, [profile]);
  useEffect(() => { if (missingVisaFields(profile).length > 0) setEditing(true); }, [profile]);

  const set = <K extends keyof VisaProfile>(k: K, v: VisaProfile[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const draftMissing = missingVisaFields(draft);
  const days = visaStayDays(profile);

  const durationText = profile.departureDate && profile.returnDate
    ? t("visa2.profile.durationDates", { days })
    : profile.durationBucket ? t(`prepQuiz.dates.bucket.${profile.durationBucket}`) : "";

  const rows: Array<{ field: VisaField | null; label: string; value: string }> = [
    { field: "destination", label: t("visa2.profile.destination"), value: [countryLabel(profile.destinationCode), profile.city].filter(Boolean).join(" — ") },
    { field: "nationality", label: t("visa2.profile.nationality"), value: [countryLabel(profile.nationality), countryLabel(profile.secondNationality)].filter(Boolean).join(" + ") },
    { field: "residence", label: t("visa2.profile.residence"), value: countryLabel(profile.residence) },
    { field: "stayType", label: t("visa2.profile.purpose"), value: profile.stayType ? t(`prepQuiz.stay.${profile.stayType}.title`, { defaultValue: profile.stayType }) : "" },
    { field: "duration", label: t("visa2.profile.duration"), value: durationText },
    { field: "passportType", label: t("visa2.profile.passport"), value: profile.passportType ? t(`visa2.profile.passportTypes.${profile.passportType}`) : "" },
    { field: "transit", label: t("visa2.profile.transit"), value: profile.hasTransit === "no" ? t("visa2.profile.noTransit") : profile.transitCountries.map(countryLabel).filter(Boolean).join(", ") },
    { field: null, label: t("visa2.profile.regions"), value: profile.regions },
  ];

  const save = async () => {
    if (await onSave(draft)) setEditing(false);
  };

  return (
    <section aria-labelledby="visa-profile-title" className="rounded-2xl border border-border/70 bg-card/45 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden><UserRound className="h-5 w-5" /></span>
          <div>
            <h2 id="visa-profile-title" className="text-lg font-bold">{t("visa2.profile.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("visa2.profile.help")}</p>
          </div>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="mr-1.5 h-3.5 w-3.5" />{t("visa2.profile.edit")}</Button>
        )}
      </div>

      {!editing && (
        <dl className="grid gap-2 sm:grid-cols-2">
          {rows.map((r) => {
            const isMissing = r.field ? missing.includes(r.field) : false;
            if (!r.field && !r.value) return null;
            return (
              <div key={r.label} className={cn("rounded-xl px-3 py-2", isMissing ? "border border-warning/40 bg-warning/10" : "bg-muted/30")}>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{r.label}</dt>
                <dd className={cn("text-sm", isMissing ? "font-semibold text-warning" : "text-foreground")}>{r.value || t("visa2.profile.missing")}</dd>
              </div>
            );
          })}
        </dl>
      )}

      {editing && (
        <div className="space-y-5">
          {draftMissing.length > 0 && (
            <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
              {t("visa2.profile.missingIntro", { count: draftMissing.length })}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <CountryCombobox label={t("visa2.profile.destination")} value={draft.destinationCode} onChange={(c) => set("destinationCode", c)} />
            <div className="space-y-1.5">
              <Label htmlFor="vp-city">{t("visa2.profile.city")}</Label>
              <Input id="vp-city" className="h-12 text-base" value={draft.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <CountryCombobox label={t("visa2.profile.nationality")} value={draft.nationality} onChange={(c) => set("nationality", c)} />
            <CountryCombobox label={t("visa2.profile.secondNationality")} value={draft.secondNationality} onChange={(c) => set("secondNationality", c)} placeholder={t("prepQuiz.origin.secondPlaceholder")} />
            <CountryCombobox label={t("visa2.profile.residence")} value={draft.residence} onChange={(c) => set("residence", c)} />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("visa2.profile.purpose")}</legend>
            <div className="flex flex-wrap gap-2">
              {STAY_TYPES.map((s) => (
                <button key={s} type="button" aria-pressed={draft.stayType === s} onClick={() => set("stayType", s)} className={chip(draft.stayType === s)}>{t(`prepQuiz.stay.${s}.title`)}</button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vp-dep">{t("prepQuiz.dates.departure")}</Label>
              <Input id="vp-dep" type="date" value={draft.departureDate} onChange={(e) => set("departureDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vp-ret">{t("prepQuiz.dates.return")}</Label>
              <Input id="vp-ret" type="date" min={draft.departureDate || undefined} value={draft.returnDate} onChange={(e) => set("returnDate", e.target.value)} />
            </div>
          </div>
          {!(draft.departureDate && draft.returnDate) && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("prepQuiz.dates.bucketLegend")}</legend>
              <div className="flex flex-wrap gap-2">
                {DURATION_BUCKETS.map((b) => (
                  <button key={b} type="button" aria-pressed={draft.durationBucket === b} onClick={() => set("durationBucket", draft.durationBucket === b ? "" : b)} className={chip(draft.durationBucket === b)}>{t(`prepQuiz.dates.bucket.${b}`)}</button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("visa2.profile.passport")}</legend>
            <div className="flex flex-wrap gap-2">
              {PASSPORT_TYPES.map((p) => (
                <button key={p} type="button" aria-pressed={draft.passportType === p} onClick={() => set("passportType", p)} className={chip(draft.passportType === p)}>{t(`visa2.profile.passportTypes.${p}`)}</button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("visa2.profile.transitQuestion")}</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={draft.hasTransit === "no"} onClick={() => setDraft((d) => ({ ...d, hasTransit: "no", transitCountries: [] }))} className={chip(draft.hasTransit === "no")}>{t("visa2.profile.noTransit")}</button>
              <button type="button" aria-pressed={draft.hasTransit === "yes"} onClick={() => set("hasTransit", "yes")} className={chip(draft.hasTransit === "yes")}>{t("visa2.profile.withTransit")}</button>
            </div>
            {draft.hasTransit === "yes" && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {draft.transitCountries.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                      {countryLabel(c)}
                      <button type="button" aria-label={t("visa2.profile.removeTransit", { country: countryLabel(c) })} onClick={() => set("transitCountries", draft.transitCountries.filter((x) => x !== c))}><X className="h-3.5 w-3.5" /></button>
                    </span>
                  ))}
                </div>
                {draft.transitCountries.length < 5 && (
                  <CountryCombobox
                    key={draft.transitCountries.join(",")}
                    label={t("visa2.profile.addTransit")}
                    value={transitPick}
                    onChange={(c) => {
                      if (c && !draft.transitCountries.includes(c)) set("transitCountries", [...draft.transitCountries, c]);
                      setTransitPick("");
                    }}
                  />
                )}
              </div>
            )}
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="vp-regions">{t("visa2.profile.regionsQuestion")}</Label>
            <Input id="vp-regions" maxLength={200} value={draft.regions} placeholder={t("visa2.profile.regionsPlaceholder")} onChange={(e) => set("regions", e.target.value)} />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {missing.length === 0 && <Button variant="outline" onClick={() => { setDraft(profile); setEditing(false); }} disabled={saving}>{t("common.cancel")}</Button>}
            <Button onClick={save} disabled={saving || (draft.departureDate && draft.returnDate ? draft.returnDate < draft.departureDate : false)} className="gradient-button">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{t("visa2.profile.save")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default VisaProfileCard;
