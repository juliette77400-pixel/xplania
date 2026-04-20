import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft, Loader2, Activity } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import QuickJump from "@/components/shared/QuickJump";

const Suivi = () => {
  const { trips, loading } = useTrips();

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      <header className="relative border-b border-border backdrop-blur-md bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="font-bold">Suivi de Voyage</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-10">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Compagnon de voyage</p>
          <h2 className="text-3xl font-bold text-foreground mb-3">Suivez votre voyage en direct</h2>
          <p className="text-muted-foreground">
            Carte live, timeline dynamique, check-in auto et suggestions IA hyper locales.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : trips.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Crée d'abord un voyage pour activer le suivi.</p>
            <Link to="/" className="text-primary hover:underline">Créer mon voyage →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {trips.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/suivi/${t.id}`} className="glass-card rounded-2xl p-6 block hover:scale-[1.02] transition group">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-xs uppercase tracking-wider text-primary">Suivi live</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition">{t.destination || "Sans destination"}</h3>
                  {t.arrival_city && <p className="text-sm text-muted-foreground">{t.arrival_city}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.departure_date} {t.return_date && `→ ${t.return_date}`}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Suivi;
