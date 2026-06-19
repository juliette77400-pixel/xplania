import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Loader2, ArrowLeft } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import QuickJump from "@/components/shared/QuickJump";
import { useActiveTrip } from "@/stores/useActiveTrip";
import NotebookCard from "@/components/journal/NotebookCard";
import TripActionsMenu from "@/components/shared/TripActionsMenu";

const Carnets = () => {
  const { user, loading: authLoading } = useAuth();
  const { trips, loading, removeTrip } = useTrips();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setActiveTrip = useActiveTrip((s) => s.setActiveTrip);

  const open = (tr: typeof trips[number]) => {
    setActiveTrip({
      tripId: tr.id,
      destination: tr.destination,
      arrivalCity: tr.arrival_city,
      departureDate: tr.departure_date,
      returnDate: tr.return_date,
    });
    navigate(`/carnet/${tr.id}`);
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

      <main className="relative container mx-auto px-4 py-10 max-w-6xl">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t("carnets.heroTitle")}</h2>
          <p className="text-muted-foreground mt-2">{t("carnets.heroDesc")}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : trips.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">{t("carnets.empty")}</p>
            <Link to="/" className="text-primary hover:underline">{t("carnets.createFirst")}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((tr, i) => (
              <div key={tr.id} className="relative group">
                <NotebookCard trip={tr} index={i} onOpen={() => open(tr)} />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10">
                  <TripActionsMenu
                    trip={tr}
                    onChanged={() => window.location.reload()}
                    onDeleted={() => removeTrip(tr.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <QuickJump />
    </div>
  );
};

export default Carnets;
