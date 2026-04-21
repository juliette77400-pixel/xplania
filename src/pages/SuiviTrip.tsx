import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TripTracker from "@/components/tracking/TripTracker";
import QuickJump from "@/components/shared/QuickJump";

const SuiviTrip = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [destination, setDestination] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (!tripId) return;
    supabase.from("trips").select("destination,arrival_city,departure_date,return_date").eq("id", tripId).maybeSingle()
      .then(({ data }) => {
        setDestination(data?.arrival_city || data?.destination || "");
        if (data) {
          import("@/stores/useActiveTrip").then(({ useActiveTrip }) => {
            useActiveTrip.getState().setActiveTrip({
              tripId,
              destination: data.destination,
              arrivalCity: data.arrival_city,
              departureDate: data.departure_date,
              returnDate: data.return_date,
            });
          });
        }
      });
  }, [tripId]);

  if (!tripId) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border backdrop-blur-md bg-background/60 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/suivi" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> {t("suiviTrip.back")}
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="font-bold">{t("suiviTrip.title")}{destination && ` — ${destination}`}</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <TripTracker tripId={tripId} destination={destination} />
      </main>
      <QuickJump />
    </div>
  );
};

export default SuiviTrip;
