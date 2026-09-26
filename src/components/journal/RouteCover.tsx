import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { TripStats } from "@/hooks/useTripStats";

const GoogleTripMap = lazy(() => import("@/components/tracking/GoogleTripMap"));

interface Props {
  tripId: string;
  title: string;
  destination: string;
  stats: TripStats | null;
}

const RouteCover = ({ tripId, title, destination, stats }: Props) => {
  const { t } = useTranslation();
  const hasRoute = !!stats && (stats.activities.some((a) => a.lat != null) || stats.positions.length > 0);

  return (
    <section className="relative rounded-2xl overflow-hidden border border-border">
      {hasRoute ? (
        <Suspense fallback={<div className="h-[280px] bg-muted/30" />}>
          <GoogleTripMap position={null} activities={stats!.activities} positions={stats!.positions} height={280} />
        </Suspense>
      ) : (
        <div className="h-[180px] bg-gradient-to-br from-primary/20 via-background to-accent/20 flex flex-col items-center justify-center gap-2 text-center px-4">
          <p className="text-sm text-muted-foreground">{t("routeCover.empty")}</p>
          <Link to={`/suivi/${tripId}`} className="text-sm text-primary hover:underline">{t("routeCover.cta")}</Link>
        </div>
      )}
      <div className="absolute top-3 left-3 rounded-xl bg-background/80 backdrop-blur px-3 py-2 pointer-events-none">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold">{t("routeCover.label")}</p>
        <p className="text-sm font-bold text-foreground">{destination || title}</p>
      </div>
    </section>
  );
};

export default RouteCover;
