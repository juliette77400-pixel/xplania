import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Calendar, Compass, Heart, Activity, Briefcase, BookOpen, Trophy, Sparkles, ArrowRight } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import QuickJump from "@/components/shared/QuickJump";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";

const MODULES = [
  { to: "/discover", label: "Découvrir", icon: Compass, color: "from-cyan-500/20 to-blue-500/20", desc: "Lieux locaux & gems" },
  { to: "/mood", label: "Mood Explorer", icon: Heart, color: "from-pink-500/20 to-purple-500/20", desc: "Lieux selon ton humeur" },
  { to: "/suivi", label: "Suivi de voyage", icon: Activity, color: "from-emerald-500/20 to-teal-500/20", desc: "GPS temps réel & POI" },
  { to: "/carnets", label: "Carnet de bord", icon: BookOpen, color: "from-amber-500/20 to-orange-500/20", desc: "Journal IA & souvenirs" },
  { to: "/guide-valise", label: "Valise", icon: Briefcase, color: "from-violet-500/20 to-fuchsia-500/20", desc: "Liste personnalisée" },
  { to: "/gamification", label: "Badges", icon: Trophy, color: "from-yellow-500/20 to-amber-500/20", desc: "Progression & récompenses" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { trips, loading } = useTrips();
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const firstName = profile?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || "voyageur";
  const activeTrips = trips.filter((t) => {
    if (!t.return_date) return true;
    return new Date(t.return_date) >= new Date();
  });

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-6 sm:py-10 space-y-8 max-w-6xl">
        {/* Hero greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
            <Sparkles className="inline w-3 h-3 mr-1" /> Mon espace Xplania
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold">
            Bonjour <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTrips.length > 0
              ? `Tu as ${activeTrips.length} voyage${activeTrips.length > 1 ? "s" : ""} en cours.`
              : "Prêt à planifier ta prochaine aventure ?"}
          </p>
        </motion.div>

        {/* Voyages */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Mes voyages</h2>
            <Link to="/" className="text-xs text-primary hover:underline">Créer un voyage →</Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : trips.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <div className="text-5xl mb-3">✈️</div>
              <h3 className="font-bold mb-1">Aucun voyage pour l'instant</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Lance-toi : crée ton premier voyage en moins de 2 minutes.
              </p>
              <Button asChild className="gradient-button">
                <Link to="/"><Plus className="w-4 h-4 mr-2" /> Créer mon premier voyage</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trips.slice(0, 6).map((t) => (
                <Link key={t.id} to={`/carnet/${t.id}`}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors h-full"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{t.title || t.destination || "Voyage sans titre"}</h3>
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                    </div>
                    {t.destination && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {t.destination}
                      </p>
                    )}
                    {t.departure_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" /> {new Date(t.departure_date).toLocaleDateString("fr-FR")}
                        {t.duration && <span> · {t.duration}j</span>}
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
          <h2 className="text-lg font-bold">Explore tes modules</h2>
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
              <h3 className="font-bold text-base mb-1">Besoin d'inspiration ?</h3>
              <p className="text-sm text-muted-foreground">Laisse l'IA te suggérer un mood ou un lieu surprise.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/mood"><Heart className="w-4 h-4 mr-2" /> Surprends-moi <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Card>
      </div>
      <QuickJump />
    </div>
  );
};

export default Dashboard;
