// Module 2 — homes the student spotted elsewhere, compared side by side.
// No automatic reliability score: only the figures the student typed.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ClipboardCheck, ExternalLink, Home, Loader2, Pencil, Plus, RefreshCw, Star, Trash2, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { budgetStorageKey, housingBudgetPlan, housingFit, maxRentFromBudget, monthlyCost, stayMonths, stayTotalCost, upfrontCost } from "@/lib/housing";
import HousingFitDialog from "./HousingFitDialog";
import { useHousingOptions, type HousingOption } from "@/hooks/useHousing";
import HousingFormDialog from "./HousingFormDialog";
import HousingBudgetDialog, { readHousingSync } from "./HousingBudgetDialog";

interface Props {
  tripId: string;
  destination: string;
  city: string;
  departureDate: string | null;
  durationDays: string | number | null;
  /** Home already confirmed: the block is used to note its costs for the budget. */
  confirmed?: boolean;
  returnDate?: string | null;
  /** Maximum rent the student set (null = follow the Budget). */
  maxRentOverride?: number | null;
  onSaveMaxRent?: (v: number | null) => Promise<void>;
}

/** Accommodation line of the Budget guide for this trip (0 when no budget yet). */
function budgetAccommodation(destination: string, departureDate: string | null): number {
  try {
    const raw = localStorage.getItem(budgetStorageKey(destination, departureDate));
    const st = raw ? JSON.parse(raw) : null;
    return Number(st?.categories?.find((c: { key: string }) => c.key === "accommodation")?.planned) || 0;
  } catch { return 0; }
}

const HousingComparator = ({ tripId, destination, city, departureDate, durationDays, confirmed, returnDate, maxRentOverride, onSaveMaxRent }: Props) => {
  const { t, i18n } = useTranslation();
  const { options, loading, error, refetch, save, remove, setFavorite } = useHousingOptions(tripId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HousingOption | null>(null);
  const [toDelete, setToDelete] = useState<HousingOption | null>(null);
  const [budgetFor, setBudgetFor] = useState<HousingOption | null>(null);
  const [syncTick, setSyncTick] = useState(0);
  const [fitFor, setFitFor] = useState<HousingOption | null>(null);
  const [maxDraft, setMaxDraft] = useState<string | null>(null);
  const [savingMax, setSavingMax] = useState(false);

  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-GB";
  const fmt = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const unknown = t("housing.compare.unknown");
  const yesNo = (v: boolean | null) => (v === null ? unknown : v ? t("housing.form.yes") : t("housing.form.no"));

  const favorite = options.find((o) => o.is_favorite) ?? null;
  // syncTick re-reads what was last sent to the budget.
  void syncTick;
  const sync = readHousingSync(tripId);
  const months = stayMonths(durationDays) ?? 1;
  const budgetMax = maxRentFromBudget(budgetAccommodation(destination, departureDate), stayMonths(durationDays));
  const maxRent = maxRentOverride && maxRentOverride > 0 ? maxRentOverride : budgetMax;
  const fitCtx = { maxRent, stayStart: departureDate, stayEnd: returnDate ?? null };
  const saveMax = async () => {
    if (!onSaveMaxRent || maxDraft === null) return;
    const v = maxDraft.trim() ? Math.round(Number(maxDraft)) : null;
    if (v !== null && (!Number.isFinite(v) || v <= 0)) { toast.error(t("housing.maxRent.error")); return; }
    setSavingMax(true);
    try { await onSaveMaxRent(v); setMaxDraft(null); toast.success(t("housing.maxRent.saved")); }
    catch { toast.error(t("housing.maxRent.error")); }
    finally { setSavingMax(false); }
  };
  const BUDGET_BADGE = { fits: "bg-success/15 text-success", tight: "bg-warning/15 text-warning", over: "bg-destructive/15 text-destructive", unknown: "bg-muted text-muted-foreground" } as const;
  const budgetOutdated = !!(favorite && sync && (() => {
    const plan = housingBudgetPlan(favorite, months);
    return sync.optionId !== favorite.id || sync.deposit !== plan.deposit || sync.accommodation !== plan.accommodation;
  })());

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (o: HousingOption) => { setEditing(o); setFormOpen(true); };

  const toggleFavorite = (o: HousingOption) =>
    setFavorite.mutate({ id: o.id, favorite: !o.is_favorite }, { onError: () => toast.error(t("housing.compare.errorSave")) });

  const confirmDelete = () => {
    if (!toDelete) return;
    remove.mutate(toDelete.id, {
      onSuccess: () => toast.success(t("housing.compare.deleted")),
      onError: () => toast.error(t("housing.compare.errorSave")),
    });
    setToDelete(null);
  };

  const rows: Array<{ label: string; value: (o: HousingOption) => React.ReactNode }> = [
    { label: t("housing.compare.monthly"), value: (o) => <span className="font-bold">{fmt(monthlyCost(o))}{o.charges_included === null ? <span className="block text-[11px] font-normal text-muted-foreground">{t("housing.compare.chargesUnknown")}</span> : null}</span> },
    { label: t("housing.compare.budgetFit"), value: (o) => { const b = housingFit(o, fitCtx).budget; return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${BUDGET_BADGE[b]}`}>{t(`housing.fit.badge.${b}`)}</span>; } },
    { label: t("housing.compare.stayTotal", { months }), value: (o) => fmt(stayTotalCost(o, months)) },
    { label: t("housing.compare.upfront"), value: (o) => fmt(upfrontCost(o)) },
    { label: t("housing.form.deposit"), value: (o) => (o.deposit != null ? fmt(o.deposit) : unknown) },
    { label: t("housing.compare.location"), value: (o) => [o.neighborhood, o.city].filter(Boolean).join(", ") || unknown },
    { label: t("housing.form.type"), value: (o) => (o.housing_type ? t(`housing.types.${o.housing_type}`) : unknown) },
    { label: t("housing.form.furnished"), value: (o) => yesNo(o.furnished) },
    { label: t("housing.form.commute"), value: (o) => [o.commute_minutes != null ? t("housing.compare.minutes", { n: o.commute_minutes }) : "", o.commute || ""].filter(Boolean).join(" · ") || unknown },
    { label: t("housing.compare.lease"), value: (o) => <>{t("housing.compare.contract")} : {yesNo(o.written_contract)}{o.lease_notes ? <span className="block text-[11px] text-muted-foreground">{o.lease_notes}</span> : null}</> },
    { label: t("housing.compare.risks"), value: (o) => { const n = housingFit(o, fitCtx).points.filter((p) => p.tone === "danger" || p.tone === "warn").length; return n ? <span className="font-semibold text-warning">{t("housing.compare.risksCount", { count: n })}</span> : <span className="text-muted-foreground">{t("housing.compare.risksNone")}</span>; } },
    { label: t("housing.compare.dates"), value: (o) => (o.available_from ? `${fmtDate(o.available_from)}${o.available_to ? ` → ${fmtDate(o.available_to)}` : ""}` : unknown) },
    { label: t("housing.form.pros"), value: (o) => o.pros || "—" },
    { label: t("housing.form.cons"), value: (o) => o.cons || "—" },
    { label: t("housing.form.notes"), value: (o) => o.notes || "—" },
  ];

  const actions = (o: HousingOption) => (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" variant={o.is_favorite ? "default" : "outline"} className={o.is_favorite ? "gradient-button" : ""} aria-pressed={o.is_favorite} onClick={() => toggleFavorite(o)}>
        <Star className={`mr-1 h-3.5 w-3.5 ${o.is_favorite ? "fill-current" : ""}`} />{o.is_favorite ? t("housing.compare.favorite") : t("housing.compare.markFavorite")}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setFitFor(o)}><ClipboardCheck className="mr-1 h-3.5 w-3.5" />{t("housing.fit.cta")}</Button>
      <Button size="sm" variant="outline" aria-label={t("housing.compare.edit", { name: o.name })} onClick={() => openEdit(o)}><Pencil className="mr-1 h-3.5 w-3.5" />{t("housing.compare.editShort")}</Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label={t("housing.compare.delete", { name: o.name })} onClick={() => setToDelete(o)}><Trash2 className="h-3.5 w-3.5" /></Button>
      {o.listing_url && (
        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
          <a href={o.listing_url} target="_blank" rel="noopener noreferrer nofollow" aria-label={t("housing.compare.openListing", { name: o.name })}><ExternalLink className="h-3.5 w-3.5" /></a>
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t(confirmed ? "housing.compare.helpConfirmed" : "housing.compare.help")}</p>
        <Button onClick={openAdd} className="gradient-button"><Plus className="mr-1.5 h-4 w-4" />{t(confirmed && options.length === 0 ? "housing.compare.addConfirmed" : "housing.compare.add")}</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-sm">
          <p className="font-semibold">{maxRent ? t("housing.maxRent.value", { amount: fmt(maxRent) }) : t("housing.maxRent.none")}</p>
          <p className="text-xs text-muted-foreground">{maxRentOverride ? t("housing.maxRent.fromYou") : budgetMax ? t("housing.maxRent.fromBudget", { months }) : t("housing.maxRent.noBudget")}</p>
        </div>
        {onSaveMaxRent && (maxDraft === null ? (
          <Button size="sm" variant="outline" onClick={() => setMaxDraft(maxRent ? String(maxRent) : "")}>{t("housing.maxRent.edit")}</Button>
        ) : (
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="max-rent" className="text-xs">{t("housing.maxRent.label")}</Label>
              <Input id="max-rent" type="number" min={0} inputMode="numeric" className="h-9 w-32" value={maxDraft} onChange={(e) => setMaxDraft(e.target.value)} placeholder={budgetMax ? String(budgetMax) : ""} />
            </div>
            <Button size="sm" onClick={() => void saveMax()} disabled={savingMax}>{savingMax ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("common.save")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setMaxDraft(null)}>{t("common.cancel")}</Button>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
      ) : error ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>{t("housing.compare.errorLoad")}</span>
          <Button size="sm" variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.retry")}</Button>
        </div>
      ) : options.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-center">
          <Home className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="font-semibold">{t(confirmed ? "housing.compare.emptyTitleConfirmed" : "housing.compare.emptyTitle")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t(confirmed ? "housing.compare.emptyDescConfirmed" : "housing.compare.emptyDesc")}</p>
        </div>
      ) : (
        <>
          {/* Phones: one card per home */}
          <ul className="space-y-3 md:hidden">
            {options.map((o) => (
              <li key={o.id} className={`rounded-xl border p-4 ${o.is_favorite ? "border-primary/60 bg-primary/5" : "border-border/60 bg-background/50"}`}>
                <p className="font-bold">{o.name}</p>
                <dl className="mt-2 space-y-1 text-sm">
                  {rows.map((r) => (
                    <div key={r.label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{r.label}</dt><dd className="text-right">{r.value(o)}</dd></div>
                  ))}
                </dl>
                <div className="mt-3">{actions(o)}</div>
              </li>
            ))}
          </ul>
          {/* Larger screens: side-by-side table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border/60 md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("housing.compare.tableCaption")}</caption>
              <thead>
                <tr className="bg-muted/40">
                  <th scope="col" className="w-40 px-3 py-2 text-left font-semibold text-muted-foreground">{t("housing.compare.criteria")}</th>
                  {options.map((o) => (
                    <th key={o.id} scope="col" className={`min-w-44 px-3 py-2 text-left font-bold ${o.is_favorite ? "text-primary" : ""}`}>
                      {o.is_favorite && <Star className="mr-1 inline h-3.5 w-3.5 fill-current" aria-hidden />}{o.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="px-3 py-2 text-left font-medium text-muted-foreground">{r.label}</th>
                    {options.map((o) => <td key={o.id} className="px-3 py-2 align-top">{r.value(o)}</td>)}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="px-3 py-2 text-left font-medium text-muted-foreground">{t("housing.compare.actions")}</th>
                  {options.map((o) => <td key={o.id} className="px-3 py-2">{actions(o)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{t("housing.compare.upfrontHelp")}</p>

          {favorite ? (
            <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{budgetOutdated ? t("housing.compare.budgetOutdated", { name: favorite.name }) : sync?.optionId === favorite.id ? t("housing.compare.budgetSynced", { name: favorite.name }) : t("housing.compare.budgetHint", { name: favorite.name })}</span>
              <Button size="sm" variant="outline" onClick={() => setBudgetFor(favorite)}>
                <Wallet className="mr-1.5 h-3.5 w-3.5" />{budgetOutdated ? t("housing.compare.budgetUpdate") : t("housing.compare.budgetAdd")}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("housing.compare.favoriteHint")}</p>
          )}
        </>
      )}

      {(save.isPending || remove.isPending || setFavorite.isPending) && (
        <p role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t("housing.saving")}</p>
      )}

      <HousingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        defaultCity={city}
        onSubmit={async (values) => {
          await save.mutateAsync({ id: editing?.id, values });
          toast.success(t(editing ? "housing.compare.updated" : "housing.compare.saved"));
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("housing.compare.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("housing.compare.deleteDesc", { name: toDelete?.name ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HousingFitDialog option={fitFor} ctx={fitCtx} months={months} onOpenChange={(v) => !v && setFitFor(null)} />

      {budgetFor && (
        <HousingBudgetDialog
          open={!!budgetFor}
          onOpenChange={(v) => !v && setBudgetFor(null)}
          option={budgetFor}
          tripId={tripId}
          destination={destination}
          departureDate={departureDate}
          durationDays={durationDays}
          onSynced={() => setSyncTick((n) => n + 1)}
        />
      )}
    </div>
  );
};

export default HousingComparator;
