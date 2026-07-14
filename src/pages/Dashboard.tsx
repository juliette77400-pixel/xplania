import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Activity, ArrowRight, BookOpen, Calendar, Compass, Heart, Luggage, MapPin, Plus, Sparkles } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import TripActionsMenu from "@/components/shared/TripActionsMenu";
import StreakCard from "@/components/dashboard/StreakCard";
import WeeklyMissionsCard from "@/components/dashboard/WeeklyMissionsCard";
import PastTripsTrophies from "@/components/dashboard/PastTripsTrophies";
import NextTripUtilitiesCard from "@/components/dashboard/NextTripUtilitiesCard";

const Dashboard = () => {
  const { user } = useAuth();
  const { trips, loading, removeTrip } = useTrips();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  const isFr = i18n.language.startsWith("fr");
  const dateLocale = isFr ? "fr-FR" : "en-US";
  const firstName = profile?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || (isFr ? "voyageur" : "traveler");
  const activeTrips = trips.filter((trip) => !trip.return_date || new Date(trip.return_date) >= new Date());

  const phases = [
    { key: "prepare", icon: Luggage, title: t("myDashboard.phases.prepare.title"), desc: t("myDashboard.phases.prepare.desc"), primary: "/guide-budget", links: [[t("appNav.budget"), "/guide-budget"], [t("appNav.visa"), "/guide-visa"], [t("appNav.suitcase"), "/guide-valise"]] },
    { key: "explore", icon: Compass, title: t("myDashboard.phases.explore.title"), desc: t("myDashboard.phases.explore.desc"), primary: "/discover", links: [[t("appNav.discover"), "/discover"], [t("appNav.mood"), "/mood"], [t("appNav.explore"), "/explore"]] },
    { key: "travel", icon: Activity, title: t("myDashboard.phases.travel.title"), desc: t("myDashboard.phases.travel.desc"), primary: "/suivi", links: [[t("appNav.tracking"), "/suivi"], [t("appNav.badges"), "/gamification"]] },
    { key: "relive", icon: BookOpen, title: t("myDashboard.phases.relive.title"), desc: t("myDashboard.phases.relive.desc"), primary: "/carnets", links: [[t("appNav.journal"), "/carnets"], [t("appNav.badges"), "/gamification"]] },
  ];

  return <div className="min-h-screen bg-background">
    <AppNavbar />
    <main className="container mx-auto max-w-6xl space-y-10 px-4 py-7 sm:py-12">
      <motion.header initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Sparkles className="mr-1 inline h-3.5 w-3.5" />{t("myDashboard.kicker")}</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("myDashboard.greetingSimple")} <span className="gradient-text">{firstName}</span></h1><p className="mt-2 text-sm text-muted-foreground">{activeTrips.length ? t("myDashboard.tripsActive", {count:activeTrips.length}) : t("myDashboard.noTripsCta")}</p></div>
        <Button asChild className="gradient-button h-11 rounded-xl px-5 font-bold text-primary-foreground"><Link to="/"><Plus className="mr-2 h-4 w-4" />{t("myDashboard.createTrip")}</Link></Button>
      </motion.header>

      <section aria-labelledby="next-trip-title"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{t("myDashboard.copilotKicker")}</p><h2 id="next-trip-title" className="mt-1 text-xl font-bold sm:text-2xl">{t("myDashboard.nextTripTitle")}</h2></div></div><NextTripUtilitiesCard trips={trips} /></section>

      <section aria-labelledby="journey-actions"><div className="mb-5 max-w-2xl"><h2 id="journey-actions" className="text-xl font-bold sm:text-2xl">{t("myDashboard.journeyTitle")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("myDashboard.journeyDesc")}</p></div><div className="grid gap-4 md:grid-cols-2">{phases.map((phase,index)=><motion.article key={phase.key} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:index*.07}} className="group rounded-2xl border border-border/70 bg-card/45 p-6 transition hover:border-primary/35"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10"><phase.icon className="h-5 w-5 text-primary" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">{phase.title}</h3><Link to={phase.primary} aria-label={phase.title} className="rounded-lg p-2 text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowRight className="h-4 w-4" /></Link></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{phase.desc}</p><div className="mt-4 flex flex-wrap gap-2">{phase.links.map(([label,to])=><Link key={`${label}-${to}`} to={to} className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{label}</Link>)}</div></div></div></motion.article>)}</div></section>

      <section className="space-y-4" aria-labelledby="my-trips-title"><div className="flex items-center justify-between"><h2 id="my-trips-title" className="text-xl font-bold sm:text-2xl">{t("myDashboard.myTrips")}</h2><Link to="/" className="rounded text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t("myDashboard.createTrip")}</Link></div>
        {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map(i=><Skeleton key={i} className="h-40 rounded-2xl" />)}</div> : trips.length===0 ? <Card className="border-dashed p-8 text-center sm:p-12"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><MapPin className="h-6 w-6 text-primary" /></div><h3 className="font-bold">{t("myDashboard.noTripsTitle")}</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("myDashboard.noTripsDesc")}</p><Button asChild className="gradient-button mt-5"><Link to="/"><Plus className="mr-2 h-4 w-4" />{t("myDashboard.createFirstTrip")}</Link></Button></Card> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{trips.slice(0,6).map(tr=><div key={tr.id} className="group relative"><Link to={`/carnet/${tr.id}`} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><motion.div whileHover={{y:-3}} className="h-full rounded-2xl border border-border bg-card/50 p-5 transition-colors hover:border-primary/40"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Compass className="h-4 w-4 text-primary" /></div><h3 className="line-clamp-2 pr-7 font-bold">{tr.title||tr.destination||t("myDashboard.untitledTrip")}</h3>{tr.destination&&<p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{tr.destination}</p>}{tr.departure_date&&<p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{new Date(tr.departure_date).toLocaleDateString(dateLocale)}{tr.duration&&<span>· {tr.duration}{isFr?"j":"d"}</span>}</p>}</motion.div></Link><div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"><TripActionsMenu trip={tr} onChanged={()=>window.location.reload()} onDeleted={()=>removeTrip(tr.id)} /></div></div>)}</div>}
      </section>

      <section className="space-y-4" aria-labelledby="progress-title"><div><h2 id="progress-title" className="text-xl font-bold sm:text-2xl">{t("myDashboard.progressTitle")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("myDashboard.progressDesc")}</p></div><div className="grid gap-3 md:grid-cols-2"><StreakCard /><WeeklyMissionsCard /></div></section>
      <PastTripsTrophies trips={trips} />
    </main>
    <QuickJump />
  </div>;
};
export default Dashboard;
