import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Plus, MapPin, Calendar, Compass, Heart, Activity, Briefcase, BookOpen, Trophy, Sparkles, ArrowRight } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import DeleteTripButton from "@/components/shared/DeleteTripButton";

const Dashboard = () => {
  const { user } = useAuth();
  const { trips, loading, removeTrip } = useTrips();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const isFr = i18n.language.startsWith("fr");
  const dateLocale = isFr ? "fr-FR" : "en-US";
  const fallbackName = isFr ? "voyageur" : "traveler";
  const firstName = profile?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || fallbackName;
  const activeTrips = trips.filter((t) => {
    if (!t.return_date) return true;
    return new Date(t.return_date) >= new Date();
  });

  const MODULES = [
    { to: "/discover", label: t("appNav.discover"), icon: Compass, color: "from-cyan-500/20 to-blue-500/20", desc: t("myDashboard.modDiscoverDesc") },
    { to: "/mood", label: t("appNav.mood"), icon: Heart, color: "from-pink-500/20 to-purple-500/20", desc: t("myDashboard.modMoodDesc") },
    { to: "/suivi", label: t("appNav.tracking"), icon: Activity, color: "from-emerald-500/20 to-teal-500/20", desc: t("myDashboard.modTrackingDesc") },
    { to: "/carnets", label: t("appNav.journal"), icon: BookOpen, color: "from-amber-500/20 to-orange-500/20", desc: t("myDashboard.modJournalDesc") },
    { to: "/guide-valise", label: t("appNav.suitcase"), icon: Briefcase, color: "from-violet-500/20 to-fuchsia-500/20", desc: t("myDashboard.modValiseDesc") },
    { to: "/gamification", label: t("appNav.badges"), icon: Trophy, color: "from-yellow-500/20 to-amber-500/20", desc: t("myDashboard.modBadgesDesc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-6 sm:py-10 space-y-8 max-w-6xl">
        {/* Hero greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
            <Sparkles className="inline w-3 h-3 mr-1" /> {t("myDashboard.kicker")}
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold">
            {t("myDashboard.greeting", { name: firstName }).split(firstName)[0]}
            <span className="gradient-text">{firstName}</span>
            {t("myDashboard.greeting", { name: firstName }).split(firstName)[1]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTrips.length > 0
              ? t("myDashboard.tripsActive", { count: activeTrips.length })
              : t("myDashboard.noTripsCta")}
          </p>
        </motion.div>

        {/* Voyages */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("myDashboard.myTrips")}</h2>
            <Link to="/" className="text-xs text-primary hover:underline">{t("myDashboard.createTrip")}</Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : trips.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <div className="text-5xl mb-3">✈️</div>
              <h3 className="font-bold mb-1">{t("myDashboard.noTripsTitle")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("myDashboard.noTripsDesc")}
              </p>
              <Button asChild className="gradient-button">
                <Link to="/"><Plus className="w-4 h-4 mr-2" /> {t("myDashboard.createFirstTrip")}</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trips.slice(0, 6).map((tr) => (
                <Link key={tr.id} to={`/carnet/${tr.id}`}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors h-full"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{tr.title || tr.destination || t("myDashboard.untitledTrip")}</h3>
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                    </div>
                    {tr.destination && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {tr.destination}
                      </p>
                    )}
                    {tr.departure_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" /> {new Date(tr.departure_date).toLocaleDateString(dateLocale)}
                        {tr.duration && <span> · {tr.duration}{isFr ? "j" : "d"}</span>}
                      </p>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Modules */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold">{t("myDashboard.exploreModules")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.to}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={m.to}>
                  <div className={`rounded-2xl border border-border bg-gradient-to-br ${m.color} p-4 hover:border-primary/40 transition-all hover:scale-[1.03] h-full`}>
                    <m.icon className="w-5 h-5 text-primary mb-2" />
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-base mb-1">{t("myDashboard.ctaInspirationTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("myDashboard.ctaInspirationDesc")}</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/mood"><Heart className="w-4 h-4 mr-2" /> {t("myDashboard.ctaInspirationBtn")} <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Card>
      </div>
      <QuickJump />
    </div>
  );
};

export default Dashboard;

