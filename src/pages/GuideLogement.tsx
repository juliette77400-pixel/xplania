// Assistant Logement — 5th preparation tool. Helps the student find where to
// look, compare homes spotted elsewhere, avoid scams and get ready to move in.
// No listings, bookings or payments; no AI. Reads the trip from the questionnaire.
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarDays, Check, ClipboardCheck, Home, Loader2, MapPin, Search, ShieldAlert, Scale } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import HousingResources from "@/components/housing/HousingResources";
import HousingComparator from "@/components/housing/HousingComparator";
import { InstallChecklist, SafetyChecklist } from "@/components/housing/HousingChecklists";
import { useAuth } from "@/hooks/useAuth";
import { useTrips, type Trip } from "@/hooks/useTrips";
import { useHousingChecklist } from "@/hooks/useHousing";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTrip, hydrateTravelStoreFromTrip } from "@/stores/useActiveTrip";
import { findCountry } from "@/lib/country-match";
import { saveModuleProgress } from "@/lib/prep-progress";
import { HOUSING_STATUSES, housingProgress, isHousingStatus, safetyChecksApply, sectionOrder, type HousingSection, type HousingStatus } from "@/lib/housing";
import type { TravelFormData } from "@/types/travel";
import imgStarting from "@/assets/prep-quiz/housing-status-starting.jpg";
import imgShortlist from "@/assets/prep-quiz/housing-status-shortlist.jpg";
import imgConfirmed from "@/assets/prep-quiz/housing-status-confirmed.jpg";
import imgLost from "@/assets/prep-quiz/housing-status-lost.jpg";

const STATUS_IMAGES: Record<HousingStatus, string> = { starting: imgStarting, shortlist: imgShortlist, confirmed: imgConfirmed, lost: imgLost };
const SECTION_ICON: Record<HousingSection, typeof Search> = { resources: Search, compare: Scale, safety: ShieldAlert, install: ClipboardCheck };

/** Official renting pages, only where one was checked. */
const OFFICIAL_RENT_PAGE: Record<string, string> = {
  FR: "https://www.service-public.gouv.fr/particuliers/vosdroits/N337",
  GB: "https://www.gov.uk/government/publications/how-to-rent",
};

const Bar = ({ value, label }: { value: number; label: string }) => (
  <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted">
    <div className="h-full rounded-full gradient-button transition-all duration-500" style={{ width: `${value}%` }} />
  </div>
);

const GuideLogement = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { trips, loading, refetch } = useTrips();
  const activeTripId = useActiveTrip((s) => s.tripId);
  const [statusOpen, setStatusOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState<HousingStatus | null>(null);

  const trip: Trip | undefined = useMemo(() => trips.find((tr) => tr.id === activeTripId) ?? trips[0], [trips, activeTripId]);
  const form = (trip?.form_data as Partial<TravelFormData> | null) || {};
  const status: HousingStatus | null = isHousingStatus(form.housingStatus) ? form.housingStatus : null;
  const destination = form.destination || trip?.destination || "";
  const city = trip?.arrival_city && trip.arrival_city !== destination ? trip.arrival_city : "";
  const departureDate = form.departureDate || trip?.departure_date || null;
  const durationDays = form.duration || trip?.duration || null;
  const countryCode = findCountry(destination) || "";

  const { checked, loading: checklistLoading, error: checklistError, toggle } = useHousingChecklist(trip?.id ?? null);
  const progress = housingProgress(status, checked);
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  useEffect(() => {
    if (trip && trip.id !== activeTripId) void hydrateTravelStoreFromTrip(trip.id);
  }, [trip, activeTripId]);

  useEffect(() => {
    if (!trip || checklistLoading || checklistError || !status) return;
    saveModuleProgress("housing", trip.destination, progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, status, progress.done, progress.total, checklistLoading, checklistError]);

  if (!user) return <Navigate to="/auth?next=/guide-logement" replace />;
  if (!loading && !trip) return <Navigate to="/preparation" replace />;

  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-GB";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const when = trip?.departure_date
    ? `${fmtDate(trip.departure_date)}${trip.return_date ? ` → ${fmtDate(trip.return_date)}` : ""}`
    : form.durationBucket ? t(`prepQuiz.dates.bucket.${form.durationBucket}`) : t("prepDashboard.noDates");

  const chooseStatus = async (s: HousingStatus) => {
    if (!trip || !user) return;
    setSavingStatus(s);
    const { error } = await supabase
      .from("trips")
      .update({ form_data: { ...(trip.form_data as Record<string, unknown> || {}), housingStatus: s } as never })
      .eq("id", trip.id)
      .eq("user_id", user.id);
    setSavingStatus(null);
    if (error) { toast.error(t("housing.status.error")); return; }
    await refetch();
    await hydrateTravelStoreFromTrip(trip.id);
    setStatusOpen(false);
    toast.success(t("housing.status.saved"));
  };

  /** Merge into the latest form_data so other answers are never overwritten. */
  const saveMaxRent = async (v: number | null) => {
    if (!trip || !user) return;
    const { data: row, error: readErr } = await supabase.from("trips").select("form_data").eq("id", trip.id).eq("user_id", user.id).maybeSingle();
    if (readErr) throw readErr;
    const next = { ...((row?.form_data as Record<string, unknown>) || {}), maxRent: v };
    const { error } = await supabase.from("trips").update({ form_data: next as never }).eq("id", trip.id).eq("user_id", user.id);
    if (error) throw error;
    await refetch();
  };

  const onToggle = (item: string, done: boolean) =>
    toggle.mutate({ item, done }, { onError: () => toast.error(t("housing.checklistError")) });

  const statusPicker = (
    <div role="radiogroup" aria-label={t("prepQuiz.housingStatus.title")} className="grid grid-cols-2 gap-3">
      {HOUSING_STATUSES.map((s) => (
        <button key={s} type="button" role="radio" aria-checked={status === s} disabled={!!savingStatus} onClick={() => void chooseStatus(s)}
          className={`group relative flex h-32 flex-col overflow-hidden rounded-2xl border-2 text-left sm:h-40 ${status === s ? "border-primary" : "border-border/50"}`}>
          <img src={STATUS_IMAGES[s]} alt="" loading="lazy" width={768} height={1024} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          {status === s && <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full gradient-button"><Check className="h-4 w-4 text-primary-foreground" /></span>}
          {savingStatus === s && <span className="absolute right-3 top-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /></span>}
          <span className="relative mt-auto block p-3 text-sm font-bold leading-tight text-foreground">{t(`prepQuiz.housingStatus.${s}`)}</span>
        </button>
      ))}
    </div>
  );

  /** Title/description key of a block — wording follows the situation. */
  const sectionKey = (s: HousingSection) => {
    if (s === "install") return `housing.sections.install.${status === "confirmed" ? "confirmed" : status === "shortlist" ? "shortlist" : "starting"}`;
    if (s === "compare" && status === "confirmed") return "housing.sections.compareConfirmed";
    if (s === "safety" && !safetyChecksApply(status)) return "housing.sections.safetyAlerts";
    return `housing.sections.${s}`;
  };

  const sectionBody = (s: HousingSection) => {
    if (!trip) return null;
    switch (s) {
      case "resources":
        return <HousingResources countryCode={countryCode} countryName={destination} />;
      case "compare":
        return <HousingComparator tripId={trip.id} destination={destination} city={city || destination} departureDate={departureDate} durationDays={durationDays} confirmed={status === "confirmed"}
          returnDate={form.returnDate || trip.return_date || null} maxRentOverride={typeof form.maxRent === "number" ? form.maxRent : null} onSaveMaxRent={saveMaxRent} />;
      case "safety":
        return <SafetyChecklist checked={checked} onToggle={onToggle} disabled={checklistLoading} remindersOnly={!safetyChecksApply(status)} status={status} />;
      case "install":
        return <InstallChecklist status={status} checked={checked} onToggle={onToggle} disabled={checklistLoading} officialUrl={OFFICIAL_RENT_PAGE[countryCode]} onNextStatus={(s) => void chooseStatus(s)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {loading || !trip ? (
          <div className="space-y-4"><Skeleton className="h-48 rounded-[2rem]" /><Skeleton className="h-64 rounded-2xl" /></div>
        ) : (
          <>
            <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_90%_20%,hsl(var(--secondary)/.16),transparent_32%),linear-gradient(145deg,hsl(var(--card)),hsl(var(--background)))] p-6 sm:p-10">
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Home className="h-4 w-4" />{t("housing.kicker")}</p>
              <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{t("housing.title")}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t("housing.subtitle")}</p>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{city ? `${city}, ${destination}` : destination}</span>
                <span className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-4 w-4" />{when}</span>
              </div>

              {status && (
                <div className="mt-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm"><span className="text-muted-foreground">{t("housing.status.label")} </span><span className="font-semibold">{t(`prepQuiz.housingStatus.${status}`)}</span></p>
                    <Button size="sm" variant="outline" onClick={() => setStatusOpen(true)}>{t("housing.status.change")}</Button>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{t("housing.progress", { done: progress.done, total: progress.total })}</span><span className="font-semibold">{pct} %</span></div>
                    <Bar value={pct} label={t("housing.progressLabel")} />
                  </div>
                </div>
              )}
            </motion.header>

            {!status ? (
              <section aria-labelledby="status-title" className="rounded-2xl border border-primary/30 bg-card/60 p-5 sm:p-6">
                <h2 id="status-title" className="text-xl font-bold">{t("prepQuiz.housingStatus.title")}</h2>
                <p className="mb-4 mt-1 text-sm text-muted-foreground">{t("prepQuiz.housingStatus.subtitle")}</p>
                {statusPicker}
              </section>
            ) : (
              <>
                <p className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm text-muted-foreground">{t(`housing.focus.${status}`)}</p>
                {checklistError && (
                  <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{t("housing.checklistLoadError")}</p>
                )}
                {sectionOrder(status).map((s, i) => {
                  const Icon = SECTION_ICON[s];
                  return (
                    <motion.section key={s} aria-labelledby={`sec-${s}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-2xl border border-border/70 bg-card/45 p-5 sm:p-6">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="gradient-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><Icon className="h-5 w-5 text-primary-foreground" /></div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{t("housing.step", { n: i + 1 })}</p>
                          <h2 id={`sec-${s}`} className="text-xl font-bold">{t(`${sectionKey(s)}.title`)}</h2>
                          <p className="text-sm text-muted-foreground">{t(`${sectionKey(s)}.desc`)}</p>
                        </div>
                      </div>
                      {sectionBody(s)}
                    </motion.section>
                  );
                })}
              </>
            )}

            <p className="text-center text-xs text-muted-foreground">
              {t("housing.footer")} <Link to="/guide-budget" className="text-primary underline">{t("housing.footerBudget")}</Link>
            </p>
          </>
        )}
      </main>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("prepQuiz.housingStatus.title")}</DialogTitle>
            <DialogDescription>{t("prepQuiz.housingStatus.subtitle")}</DialogDescription>
          </DialogHeader>
          {statusPicker}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuideLogement;
