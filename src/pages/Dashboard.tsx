// Beta dashboard — built around the five preparation tools only
// (Budget, Visa, Valise, Culture, Housing), with per-module progress for the selected trip.
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, BedDouble, Briefcase, CalendarDays, CircleDashed, CircleCheck, FileCheck, Globe2, GraduationCap, ListTodo, Loader, Luggage, MapPin, Plus, Sparkles, Wallet } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTrips, type Trip } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import TripActionsMenu from "@/components/shared/TripActionsMenu";
import TripCountdown from "@/components/shared/TripCountdown";
import { tripLabels } from "@/lib/trip-label";
import SatisfactionSurveyCard from "@/components/dashboard/SatisfactionSurveyCard";
import { track } from "@/lib/analytics";
import { useActiveTrip, hydrateTravelStoreFromTrip } from "@/stores/useActiveTrip";
import { isPathEnabled } from "@/config/featureFlags";
import { isHousingStatus } from "@/lib/housing";
import { buildNextSteps, readBudgetSnapshot, readVisaSnapshot } from "@/lib/next-steps";
import { overallPercent, readTripProgress, moduleStatus, PREP_PROGRESS_EVENT, type ModuleProgress, type ModuleStatus, type PrepModule } from "@/lib/prep-progress";

const MODULES: Array<{ key: PrepModule; to: string; icon: typeof Wallet }> = [
  { key: "budget", to: "/guide-budget", icon: Wallet },
  { key: "visa", to: "/guide-visa", icon: FileCheck },
  { key: "valise", to: "/guide-valise", icon: Luggage },
  { key: "culture", to: "/guide-culture", icon: Globe2 },
  { key: "housing", to: "/guide-logement", icon: BedDouble },
];

const Bar = ({ value, label }: { value: number; label: string }) => (
  <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted">
    <div className="h-full rounded-full gradient-button transition-all duration-500" style={{ width: `${value}%` }} />
  </div>
);

const STATUS_STYLE: Record<ModuleStatus, { icon: typeof CircleCheck; className: string }> = {
  notStarted: { icon: CircleDashed, className: "border-border text-muted-foreground" },
  inProgress: { icon: Loader, className: "border-primary/40 bg-primary/10 text-primary" },
  done: { icon: CircleCheck, className: "border-secondary/40 bg-secondary/15 text-foreground" },
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trips, loading, refetch, removeTrip } = useTrips();
  const { t, i18n } = useTranslation();
  const activeTripId = useActiveTrip((s) => s.tripId);
  const clearActiveTrip = useActiveTrip((s) => s.clearActiveTrip);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [progressTick, setProgressTick] = useState(0);
  const location = useLocation();

  const viewTracked = useRef(false);

  // "Je prépare mon départ" buttons elsewhere land here with createTrip=true.
  useEffect(() => {
    if ((location.state as { createTrip?: boolean } | null)?.createTrip && !loading && trips.length > 0) {
      navigate("/preparation?new=1", { replace: true });
    }
  }, [location.state, loading, trips.length, navigate]);

  useEffect(() => {
    if (loading || trips.length === 0 || viewTracked.current) return;
    viewTracked.current = true;
    track("dashboard_viewed", { trips: trips.length });
  }, [loading, trips.length]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  // Refresh module progress when a tool saves it or the tab regains focus.
  useEffect(() => {
    const bump = () => setProgressTick((n) => n + 1);
    window.addEventListener(PREP_PROGRESS_EVENT, bump);
    window.addEventListener("focus", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(PREP_PROGRESS_EVENT, bump);
      window.removeEventListener("focus", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const isFr = i18n.language.startsWith("fr");
  const dateLocale = isFr ? "fr-FR" : "en-US";
  const firstName = profile?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || (isFr ? "voyageur" : "traveler");

  const selected: Trip | undefined = useMemo(
    () => trips.find((tr) => tr.id === activeTripId) ?? trips[0],
    [trips, activeTripId],
  );

  // Keep the tools in sync with the trip shown here.
  useEffect(() => {
    if (!loading && selected && selected.id !== activeTripId) void hydrateTravelStoreFromTrip(selected.id);
  }, [loading, selected, activeTripId]);

  const selectTrip = useCallback((id: string) => { void hydrateTravelStoreFromTrip(id); }, []);

  const progress = useMemo<Record<PrepModule, ModuleProgress> | null>(() => {
    if (!selected) return null;
    return readTripProgress({ destination: selected.destination, departureDate: selected.departure_date, stayType: (selected.form_data as { stayType?: string } | null)?.stayType });
    // progressTick forces a re-read of the saved progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, progressTick]);

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" }) : "");

  const progressLabel = (key: PrepModule, p: ModuleProgress) => {
    if (key === "budget") return t("prepDashboard.progress.budget", { done: p.done, total: p.total });
    if (key === "culture") return t("prepDashboard.progress.culture", { done: p.done, total: p.total });
    if (p.total === 0) return t("prepDashboard.progress.notStarted");
    return t(`prepDashboard.progress.${key}`, { done: p.done, total: p.total });
  };

  const openModule = async (key: PrepModule, to: string) => {
    const p = progress?.[key];
    if (!p || moduleStatus(p) === "notStarted") track("guide_started", { module: key });
    // Load the shown trip into the tools, but never let a slow or failed network call block the button.
    if (selected) {
      await Promise.race([
        hydrateTravelStoreFromTrip(selected.id).catch(() => undefined),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    }
    navigate(to);
  };

  const modules = MODULES.filter((m) => isPathEnabled(m.to));

  const stayType = (selected?.form_data as { stayType?: string } | null)?.stayType;
  const stayLabel = stayType === "erasmus" || stayType === "internship" || stayType === "other"
    ? t(`prepQuiz.stay.${stayType}.title`)
    : stayType === "trip" ? t("prepTrip.stay.trip") : "";
  const StayIcon = stayType === "internship" ? Briefcase : GraduationCap;
  const rawHousingStatus = (selected?.form_data as { housingStatus?: string } | null)?.housingStatus;
  const housingStatus = isHousingStatus(rawHousingStatus) ? rawHousingStatus : null;

  const nextSteps = useMemo(() => {
    if (!progress || !selected) return [];
    const form = (selected.form_data as { totalBudget?: number; duration?: string } | null) ?? null;
    return buildNextSteps({
      enabled: modules.map((m) => m.key),
      progress,
      visa: readVisaSnapshot(selected.id, selected.destination),
      budget: readBudgetSnapshot(selected.destination, selected.departure_date, form, selected.duration),
      housingStatus,
    });
    // progressTick (through progress) refreshes the list when a tool saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, selected, housingStatus]);
  const moduleOf = (k: PrepModule) => MODULES.find((m) => m.key === k)!;

  if (!loading && !selected) return <Navigate to="/preparation" replace />;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-5xl space-y-8 px-4 py-7 sm:py-12">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Sparkles className="mr-1 inline h-3.5 w-3.5" />{t("prepDashboard.kicker")}</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("myDashboard.greetingSimple")} <span className="gradient-text">{firstName}</span></h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("prepDashboard.subtitle")}</p>
          </div>
          {trips.length > 0 && (
            <Button onClick={() => navigate("/preparation?new=1")} className="gradient-button self-start sm:self-auto">
              <Plus className="mr-1.5 h-4 w-4" />{t("prepDashboard.newTrip")}
            </Button>
          )}
        </motion.header>

        {loading ? (
          <div className="space-y-4"><Skeleton className="h-32 rounded-2xl" /><div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div></div>
        ) : !selected ? null : (
          <>
            {trips.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("prepDashboard.myTrips")}>
                {(() => { const labels = tripLabels(trips, i18n.language, t("myDashboard.untitledTrip")); return trips.map((tr) => (
                  <button key={tr.id} type="button" onClick={() => selectTrip(tr.id)} aria-pressed={tr.id === selected.id}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${tr.id === selected.id ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {labels[tr.id]}
                  </button>
                )); })()}
              </div>
            )}

            <Card className="rounded-[1.75rem] border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{t("prepDashboard.currentTrip")}</p>
                  <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span className="truncate">{selected.arrival_city && selected.arrival_city !== selected.destination ? `${selected.arrival_city}, ${selected.destination}` : selected.destination}</span></h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />
                    {selected.departure_date ? `${formatDate(selected.departure_date)}${selected.return_date ? ` → ${formatDate(selected.return_date)}` : ""}` : (selected.form_data as { durationBucket?: string } | null)?.durationBucket ? t(`prepQuiz.dates.bucket.${(selected.form_data as { durationBucket: string }).durationBucket}`) : selected.duration ? t("prepDashboard.durationDays", { count: selected.duration }) : t("prepDashboard.noDates")}
                  </p>
                  {stayLabel && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><StayIcon className="h-4 w-4" />{stayLabel}</p>
                  )}
                </div>
                <TripActionsMenu
                  trip={selected}
                  onChanged={async () => { await refetch(); await hydrateTravelStoreFromTrip(selected.id); }}
                  onDuplicated={async (id) => { await refetch(); selectTrip(id); }}
                  onDeleted={() => { removeTrip(selected.id); clearActiveTrip(); }}
                />
              </div>
              <div className="mt-4"><TripCountdown departureDate={selected.departure_date} returnDate={selected.return_date} /></div>
              {progress && overallPercent(progress) > 0 && (
                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-semibold">{t("prepDashboard.overall")}</span><span className="font-bold text-primary">{overallPercent(progress)} %</span></div>
                  <Bar value={overallPercent(progress)} label={t("prepDashboard.overall")} />
                </div>
              )}
              {progress && overallPercent(progress) === 0 && (
                <p className="mt-5 text-sm font-medium text-foreground">{t("prepDashboard.overallZero")}</p>
              )}
            </Card>

            {nextSteps.length > 0 && (() => {
              // The most urgent step gets a big card; the others follow in a short list.
              const [first, ...rest] = nextSteps;
              const { to: firstTo, icon: FirstIcon } = moduleOf(first.module);
              return (
                <section aria-labelledby="next-title" className="space-y-3">
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/30 bg-card p-6 shadow-[0_20px_60px_hsl(var(--primary)/.12)] sm:p-7">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
                    <p id="next-title" className="text-xs font-bold uppercase tracking-[.16em] text-primary">{t("prepDashboard.nextStep.kicker")}</p>
                    <div className="mt-3 flex items-start gap-4">
                      <span className="gradient-button flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"><FirstIcon className="h-5 w-5 text-primary-foreground" aria-hidden /></span>
                      <div className="min-w-0">
                        <p className="text-lg font-bold leading-snug sm:text-xl">{first.key ? t(first.key, first.vars) : first.text}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t(`prepDashboard.modules.${first.module}.title`)}{first.urgency === 1 ? ` · ${t("prepDashboard.steps.urgent")}` : ""}</p>
                      </div>
                    </div>
                    <Button className="gradient-button mt-5 h-12 w-full text-base sm:w-auto sm:px-8" onClick={() => void openModule(first.module, firstTo)}>
                      {t("prepDashboard.nextStep.cta")}<ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                  {rest.length > 0 && (
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5">
                      <h2 className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><ListTodo className="h-4 w-4 text-primary" aria-hidden />{t("prepDashboard.nextStep.then")}</h2>
                      <ul className="mt-2 divide-y divide-border/60">
                        {rest.map((step) => {
                          const { to, icon: Icon } = moduleOf(step.module);
                          return (
                            <li key={step.id}>
                              <button type="button" onClick={() => void openModule(step.module, to)} className="flex w-full items-center gap-3 py-3 text-left text-sm transition-colors hover:text-primary">
                                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                                <span className="flex-1">{step.key ? t(step.key, step.vars) : step.text}</span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })()}

            <section aria-labelledby="modules-title" className="space-y-4">
              <h2 id="modules-title" className="text-xl font-bold sm:text-2xl">{t("prepDashboard.modulesTitle")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {modules.map(({ key, to, icon: Icon }, i) => {
                  const p = progress?.[key] ?? { done: 0, total: 0 };
                  const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                  const status = moduleStatus(p);
                  const { icon: StatusIcon, className: statusClass } = STATUS_STYLE[status];
                  return (
                    <motion.article key={key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex flex-col rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 interactive-card">
                      <div className="flex items-center gap-3">
                        <div className="gradient-button flex h-11 w-11 items-center justify-center rounded-xl"><Icon className="h-5 w-5 text-primary-foreground" /></div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold">{t(`prepDashboard.modules.${key}.title`)}</h3>
                          <p className="text-xs text-muted-foreground">{t(`prepDashboard.modules.${key}.desc`)}</p>
                          {key === "housing" && housingStatus && (
                            <p className="mt-0.5 text-xs font-medium text-primary">{t(`prepQuiz.housingStatus.${housingStatus}`)}</p>
                          )}
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>
                          <StatusIcon className="h-3 w-3" aria-hidden />{t(`prepDashboard.status.${status}`)}
                        </span>
                      </div>
                      {p.done > 0 && (
                        <div className="mt-4">
                          <div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-muted-foreground">{progressLabel(key, p)}</span><span className="font-semibold">{pct} %</span></div>
                          <Bar value={pct} label={t(`prepDashboard.modules.${key}.title`)} />
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="mt-4 self-start" onClick={() => void openModule(key, to)}>
                        {p.done > 0 ? t("prepDashboard.continue") : t("prepDashboard.open")}<ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </motion.article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <SatisfactionSurveyCard />

        <p className="text-center text-xs text-muted-foreground">
          {t("prepDashboard.offersHint")} <Link to="/offres" className="text-primary underline">{t("appNav.premiumOffers")}</Link>
        </p>
      </main>

    </div>
  );
};

export default Dashboard;
