// Beta dashboard — built around the four preparation tools only
// (Budget, Visa, Valise, Culture), with per-module progress for the selected trip.
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, CalendarDays, FileCheck, Globe2, Luggage, MapPin, Plus, Sparkles, Wallet } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useTrips, type Trip } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import TripActionsMenu from "@/components/shared/TripActionsMenu";
import TripCountdown from "@/components/shared/TripCountdown";
import TripReminderChecklist from "@/components/shared/TripReminderChecklist";
import SatisfactionSurveyCard from "@/components/dashboard/SatisfactionSurveyCard";
import CreateTripForm from "@/components/dashboard/CreateTripForm";
import { useActiveTrip, hydrateTravelStoreFromTrip } from "@/stores/useActiveTrip";
import { isPathEnabled } from "@/config/featureFlags";
import { overallPercent, readTripProgress, PREP_PROGRESS_EVENT, type ModuleProgress, type PrepModule } from "@/lib/prep-progress";

const MODULES: Array<{ key: PrepModule; to: string; icon: typeof Wallet }> = [
  { key: "budget", to: "/guide-budget", icon: Wallet },
  { key: "visa", to: "/guide-visa", icon: FileCheck },
  { key: "valise", to: "/guide-valise", icon: Luggage },
  { key: "culture", to: "/guide-culture", icon: Globe2 },
];

const Bar = ({ value, label }: { value: number; label: string }) => (
  <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted">
    <div className="h-full rounded-full gradient-button transition-all duration-500" style={{ width: `${value}%` }} />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trips, loading } = useTrips();
  const { t, i18n } = useTranslation();
  const activeTripId = useActiveTrip((s) => s.tripId);
  const clearActiveTrip = useActiveTrip((s) => s.clearActiveTrip);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [progressTick, setProgressTick] = useState(0);
  const location = useLocation();

  // "Créer mon voyage" buttons elsewhere land here with createTrip=true.
  useEffect(() => {
    if ((location.state as { createTrip?: boolean } | null)?.createTrip && !loading && trips.length > 0) {
      setCreateOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, loading, trips.length, navigate]);

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
    return readTripProgress({ destination: selected.destination, departureDate: selected.departure_date });
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

  const openModule = async (to: string) => {
    if (selected) await hydrateTravelStoreFromTrip(selected.id);
    navigate(to);
  };

  const modules = MODULES.filter((m) => isPathEnabled(m.to));

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
            <Button onClick={() => setCreateOpen(true)} className="gradient-button self-start sm:self-auto">
              <Plus className="mr-1.5 h-4 w-4" />{t("prepDashboard.newTrip")}
            </Button>
          )}
        </motion.header>

        {loading ? (
          <div className="space-y-4"><Skeleton className="h-32 rounded-2xl" /><div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div></div>
        ) : !selected ? (
          <Card className="rounded-[1.75rem] border-primary/20 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{t("prepDashboard.firstStepKicker")}</p>
            <h2 className="mt-1 text-2xl font-bold">{t("prepDashboard.firstStepTitle")}</h2>
            <p className="mt-2 mb-6 text-sm text-muted-foreground">{t("prepDashboard.firstStepDesc")}</p>
            <CreateTripForm />
          </Card>
        ) : (
          <>
            {trips.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("prepDashboard.myTrips")}>
                {trips.map((tr) => (
                  <button key={tr.id} type="button" onClick={() => selectTrip(tr.id)} aria-pressed={tr.id === selected.id}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${tr.id === selected.id ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {tr.destination || tr.title || t("myDashboard.untitledTrip")}
                  </button>
                ))}
              </div>
            )}

            <Card className="rounded-[1.75rem] border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{t("prepDashboard.currentTrip")}</p>
                  <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span className="truncate">{selected.arrival_city && selected.arrival_city !== selected.destination ? `${selected.arrival_city}, ${selected.destination}` : selected.destination}</span></h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />
                    {selected.departure_date ? `${formatDate(selected.departure_date)}${selected.return_date ? ` → ${formatDate(selected.return_date)}` : ""}` : selected.duration ? t("prepDashboard.durationDays", { count: selected.duration }) : t("prepDashboard.noDates")}
                  </p>
                </div>
                <TripActionsMenu trip={selected} onDuplicated={(id) => selectTrip(id)} onDeleted={() => clearActiveTrip()} />
              </div>
              <div className="mt-4"><TripCountdown departureDate={selected.departure_date} returnDate={selected.return_date} /></div>
              <div className="mt-5 rounded-xl border border-border/60 bg-background/50 p-4"><TripReminderChecklist tripId={selected.id} /></div>
              {progress && (
                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-semibold">{t("prepDashboard.overall")}</span><span className="font-bold text-primary">{overallPercent(progress)} %</span></div>
                  <Bar value={overallPercent(progress)} label={t("prepDashboard.overall")} />
                </div>
              )}
            </Card>

            <section aria-labelledby="modules-title" className="space-y-4">
              <h2 id="modules-title" className="text-xl font-bold sm:text-2xl">{t("prepDashboard.modulesTitle")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {modules.map(({ key, to, icon: Icon }, i) => {
                  const p = progress?.[key] ?? { done: 0, total: 0 };
                  const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                  return (
                    <motion.article key={key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex flex-col rounded-2xl border border-border/70 bg-card/60 p-5 interactive-card">
                      <div className="flex items-center gap-3">
                        <div className="gradient-button flex h-11 w-11 items-center justify-center rounded-xl"><Icon className="h-5 w-5 text-primary-foreground" /></div>
                        <div className="min-w-0">
                          <h3 className="font-bold">{t(`prepDashboard.modules.${key}.title`)}</h3>
                          <p className="text-xs text-muted-foreground">{t(`prepDashboard.modules.${key}.desc`)}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-muted-foreground">{progressLabel(key, p)}</span><span className="font-semibold">{pct} %</span></div>
                        <Bar value={pct} label={t(`prepDashboard.modules.${key}.title`)} />
                      </div>
                      <Button variant="outline" className="mt-4 self-start" onClick={() => void openModule(to)}>
                        {p.done > 0 ? t("prepDashboard.continue") : t("prepDashboard.start")}<ArrowRight className="ml-1.5 h-4 w-4" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("prepDashboard.firstStepTitle")}</DialogTitle>
            <DialogDescription>{t("prepDashboard.firstStepDesc")}</DialogDescription>
          </DialogHeader>
          <CreateTripForm onCreated={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
