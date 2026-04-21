import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BookOpen, Loader2, ArrowLeft } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import QuickJump from "@/components/shared/QuickJump";
import { useActiveTrip } from "@/stores/useActiveTrip";
import TripActionsMenu from "@/components/shared/TripActionsMenu"; // ✨ MODIFIED (Tâche 3)

const Carnets = () => {
  const { user, loading: authLoading } = useAuth();
  const { trips, loading, removeTrip } = useTrips();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setActiveTrip = useActiveTrip((s) => s.setActiveTrip);

  const openTrip = (tr: typeof trips[number], target: "carnet" | "suivi" | "explore" = "carnet") => {
    setActiveTrip({
      tripId: tr.id,
      destination: tr.destination,
      arrivalCity: tr.arrival_city,
      departureDate: tr.departure_date,
      returnDate: tr.return_date,
    });
    navigate(`/${target}/${tr.id}`);
  };

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      <header className="relative border-b border-border backdrop-blur-md bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> {t("common2.home")}</Link>
          <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /><h1 className="font-bold">{t("carnets.title")}</h1></div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-10 max-w-4xl">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : trips.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">{t("carnets.empty")}</p>
            <Link to="/" className="text-primary hover:underline">{t("carnets.createFirst")}</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {trips.map((tr, i) => (
              <motion.div key={tr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative group">
                <button onClick={() => openTrip(tr, "carnet")} className="glass-card rounded-2xl p-6 block w-full text-left hover:scale-[1.02] transition group">
                  <div className="flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-primary" /><span className="text-xs uppercase tracking-wider text-primary">{t("carnets.kicker")}</span></div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition pr-8">{tr.destination || t("common2.noDestination")}</h3>
                  {tr.arrival_city && <p className="text-sm text-muted-foreground">{tr.arrival_city}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {tr.departure_date} {tr.return_date && `→ ${tr.return_date}`}
                  </p>
                  <div className="flex gap-2 mt-3 text-xs">
                    <span onClick={(e) => { e.stopPropagation(); openTrip(tr, "suivi"); }} className="text-primary hover:underline cursor-pointer">📍 {t("carnets.tracking")}</span>
                    <span onClick={(e) => { e.stopPropagation(); openTrip(tr, "explore"); }} className="text-primary hover:underline cursor-pointer">🗺️ {t("carnets.map")}</span>
                  </div>
                </button>
                {/* ✨ MODIFIED (Tâche 3) — menu d'actions complet */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <TripActionsMenu
                    trip={tr}
                    onChanged={() => window.location.reload()}
                    onDeleted={() => removeTrip(tr.id)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <QuickJump />
    </div>
  );
};

export default Carnets;
