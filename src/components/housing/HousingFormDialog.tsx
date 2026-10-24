// Add / edit a home spotted on another website. Only name and rent are required.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HOUSING_TYPES } from "@/lib/housing";
import type { HousingOption, HousingOptionInput } from "@/hooks/useHousing";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: HousingOption | null;
  defaultCity: string;
  onSubmit: (values: HousingOptionInput) => Promise<void>;
}

type Draft = Record<
  "name" | "city" | "neighborhood" | "housing_type" | "monthly_rent" | "monthly_charges" | "deposit" | "extra_fees" | "commute" | "available_from" | "available_to" | "listing_url" | "pros" | "cons" | "notes",
  string
> & { charges_included: boolean | null; furnished: boolean | null };

const toDraft = (o: HousingOption | null, city: string): Draft => ({
  name: o?.name ?? "",
  city: o?.city ?? city,
  neighborhood: o?.neighborhood ?? "",
  housing_type: o?.housing_type ?? "",
  monthly_rent: o ? String(o.monthly_rent) : "",
  monthly_charges: o?.monthly_charges != null ? String(o.monthly_charges) : "",
  deposit: o?.deposit != null ? String(o.deposit) : "",
  extra_fees: o?.extra_fees != null ? String(o.extra_fees) : "",
  commute: o?.commute ?? "",
  available_from: o?.available_from ?? "",
  available_to: o?.available_to ?? "",
  listing_url: o?.listing_url ?? "",
  pros: o?.pros ?? "",
  cons: o?.cons ?? "",
  notes: o?.notes ?? "",
  charges_included: o?.charges_included ?? null,
  furnished: o?.furnished ?? null,
});

const num = (s: string) => {
  if (!s.trim()) return null;
  const v = Number(s.replace(",", "."));
  return Number.isFinite(v) && v >= 0 ? v : NaN;
};
const txt = (s: string) => (s.trim() ? s.trim() : null);

const HousingFormDialog = ({ open, onOpenChange, initial, defaultCity, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [d, setD] = useState<Draft>(() => toDraft(initial, defaultCity));
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setD(toDraft(initial, defaultCity)); setError(null); setMore(!!initial); }
  }, [open, initial, defaultCity]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((p) => ({ ...p, [k]: v })); setError(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) return setError(t("housing.form.errors.name"));
    const rent = num(d.monthly_rent);
    if (rent === null || Number.isNaN(rent)) return setError(t("housing.form.errors.rent"));
    const charges = num(d.monthly_charges), deposit = num(d.deposit), fees = num(d.extra_fees);
    if ([charges, deposit, fees].some((v) => Number.isNaN(v))) return setError(t("housing.form.errors.amount"));
    if (d.listing_url.trim() && !/^https?:\/\//i.test(d.listing_url.trim())) return setError(t("housing.form.errors.url"));
    if (d.available_from && d.available_to && d.available_to < d.available_from) return setError(t("housing.form.errors.dates"));
    setSaving(true);
    try {
      await onSubmit({
        name: d.name.trim().slice(0, 120),
        city: txt(d.city),
        neighborhood: txt(d.neighborhood),
        housing_type: d.housing_type || null,
        monthly_rent: rent,
        charges_included: d.charges_included,
        monthly_charges: d.charges_included ? null : charges,
        deposit,
        extra_fees: fees,
        commute: txt(d.commute),
        furnished: d.furnished,
        available_from: d.available_from || null,
        available_to: d.available_to || null,
        listing_url: txt(d.listing_url),
        pros: txt(d.pros),
        cons: txt(d.cons),
        notes: txt(d.notes),
        is_favorite: initial?.is_favorite ?? false,
      });
      onOpenChange(false);
    } catch {
      setError(t("housing.form.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`;
  const triState = (key: "charges_included" | "furnished", labels: [string, string]) => (
    <div className="flex flex-wrap gap-2">
      {([true, false] as const).map((v, i) => (
        <button key={String(v)} type="button" aria-pressed={d[key] === v} onClick={() => set(key, d[key] === v ? null : v)} className={chip(d[key] === v)}>{labels[i]}</button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? t("housing.form.editTitle") : t("housing.form.addTitle")}</DialogTitle>
          <DialogDescription>{t("housing.form.desc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hf-name">{t("housing.form.name")} *</Label>
            <Input id="hf-name" autoFocus maxLength={120} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder={t("housing.form.namePlaceholder")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hf-rent">{t("housing.form.rent")} *</Label>
              <Input id="hf-rent" type="number" min={0} inputMode="decimal" value={d.monthly_rent} onChange={(e) => set("monthly_rent", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hf-deposit">{t("housing.form.deposit")}</Label>
              <Input id="hf-deposit" type="number" min={0} inputMode="decimal" value={d.deposit} onChange={(e) => set("deposit", e.target.value)} />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("housing.form.chargesIncluded")}</legend>
            {triState("charges_included", [t("housing.form.yes"), t("housing.form.no")])}
          </fieldset>
          {d.charges_included === false && (
            <div className="space-y-1.5">
              <Label htmlFor="hf-charges">{t("housing.form.charges")}</Label>
              <Input id="hf-charges" type="number" min={0} inputMode="decimal" value={d.monthly_charges} onChange={(e) => set("monthly_charges", e.target.value)} />
            </div>
          )}

          <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="flex items-center gap-1 text-sm font-semibold text-primary">
            <ChevronDown className={`h-4 w-4 transition-transform ${more ? "rotate-180" : ""}`} aria-hidden />{t("housing.form.more")}
          </button>

          {more && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="hf-city">{t("housing.form.city")}</Label>
                  <Input id="hf-city" maxLength={120} value={d.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hf-area">{t("housing.form.neighborhood")}</Label>
                  <Input id="hf-area" maxLength={120} value={d.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
                </div>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t("housing.form.type")}</legend>
                <div className="flex flex-wrap gap-2">
                  {HOUSING_TYPES.map((ty) => (
                    <button key={ty} type="button" aria-pressed={d.housing_type === ty} onClick={() => set("housing_type", d.housing_type === ty ? "" : ty)} className={chip(d.housing_type === ty)}>{t(`housing.types.${ty}`)}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t("housing.form.furnished")}</legend>
                {triState("furnished", [t("housing.form.yes"), t("housing.form.no")])}
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="hf-fees">{t("housing.form.fees")}</Label>
                  <Input id="hf-fees" type="number" min={0} inputMode="decimal" value={d.extra_fees} onChange={(e) => set("extra_fees", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hf-commute">{t("housing.form.commute")}</Label>
                  <Input id="hf-commute" maxLength={120} value={d.commute} onChange={(e) => set("commute", e.target.value)} placeholder={t("housing.form.commutePlaceholder")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hf-from">{t("housing.form.from")}</Label>
                  <Input id="hf-from" type="date" value={d.available_from} onChange={(e) => set("available_from", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hf-to">{t("housing.form.to")}</Label>
                  <Input id="hf-to" type="date" min={d.available_from || undefined} value={d.available_to} onChange={(e) => set("available_to", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hf-url">{t("housing.form.url")}</Label>
                <Input id="hf-url" type="url" maxLength={500} value={d.listing_url} onChange={(e) => set("listing_url", e.target.value)} placeholder="https://" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="hf-pros">{t("housing.form.pros")}</Label>
                  <Textarea id="hf-pros" maxLength={600} rows={2} value={d.pros} onChange={(e) => set("pros", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hf-cons">{t("housing.form.cons")}</Label>
                  <Textarea id="hf-cons" maxLength={600} rows={2} value={d.cons} onChange={(e) => set("cons", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hf-notes">{t("housing.form.notes")}</Label>
                <Textarea id="hf-notes" maxLength={1000} rows={2} value={d.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">{t("housing.form.privacy")}</p>
            </div>
          )}

          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
            <Button type="submit" className="gradient-button" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HousingFormDialog;
