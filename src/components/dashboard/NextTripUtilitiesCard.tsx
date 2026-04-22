// ✨ NEW — Carte récap "prochain voyage" pour Dashboard
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Plane } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TripCountdown from "@/components/shared/TripCountdown";
import DestinationWeather from "@/components/shared/DestinationWeather";
import type { Trip } from "@/hooks/useTrips";

interface Props {
  trips: Trip[];
}

const NextTripUtilitiesCard = ({ trips }: Props) => {
  const { t } = useTranslation();

  const next = useMemo(() => {
    const now = new Date();
    return trips
      .filter((tr) => tr.departure_date)
      .map((tr) => ({ tr, dep: new Date(tr.departure_date!) }))
      .filter(({ tr, dep }) => {
        if (tr.return_date) return new Date(tr.return_date) >= now;
        return dep >= now;
      })
      .sort((a, b) => a.dep.getTime() - b.dep.getTime())[0]?.tr;
  }, [trips]);

  if (!next) return null;

  return (
    <Card className="p-5 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary font-semibold flex items-center gap-1">
            <Plane className="w-3 h-3" /> {t("tripUtils.nextTrip")}
          </p>
          <h3 className="font-bold text-base mt-1">{next.title || next.destination}</h3>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link to={`/carnet/${next.id}`}>
            {t("tripUtils.open")} <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-4 flex-wrap">
        <TripCountdown departureDate={next.departure_date} returnDate={next.return_date} />
        <DestinationWeather destination={next.destination} compact />
      </div>
    </Card>
  );
};

export default NextTripUtilitiesCard;
