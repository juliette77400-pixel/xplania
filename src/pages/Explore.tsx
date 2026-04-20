import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Compass, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";

const Explore = () => {
  const { user, loading: authLoading } = useAuth();
  const { trips, loading } = useTrips();

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
      <header className="relative border-b border-border backdrop-blur-md bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Accueil</Link>
          <div className="flex items-center gap-2"><Compass className="w-5 h-5 text-primary" /><h1 className="font-bold">Travel Map</h1></div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Tes voyages gamifiés</h2>
          <p className="text-muted-foreground text-sm">Choisis un voyage pour explorer ta carte interactive et débloquer des badges.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : trips.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Aucun voyage enregistré.</p>
            <Link to="/" className="text-primary hover:underline">Créer mon premier voyage →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {trips.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/explore/${t.id}`} className="glass-card rounded-2xl p-6 block hover:scale-[1.02] transition group">
                  <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-primary" /><span className="text-xs uppercase tracking-wider text-primary">Travel Map</span></div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition">{t.destination || "Sans destination"}</h3>
                  {t.departure_date && <p className="text-xs text-muted-foreground mt-1">À partir du {new Date(t.departure_date).toLocaleDateString("fr-FR")}</p>}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Explore;
