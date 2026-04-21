import { useMemo } from "react";
import { Target, MapPin, Navigation, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TripActivity } from "@/hooks/useTracking";
import { Position, haversineKm } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";

interface Props {
  activities: TripActivity[];
  position: Position | null;
  onMarkInProgress: (id: string) => void;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const TodayFocus = ({ activities, position, onMarkInProgress }: Props) => {
  const { t } = useTranslation();
  const { todays, next } = useMemo(() => {
    const today = todayKey();
    const todays = activities
      .filter((a) => a.day_date === today)
      .sort((a, b) => a.position - b.position);
    const next = todays.find((a) => a.status !== "done") || null;
    return { todays, next };
  }, [activities]);

  if (todays.length === 0) return null;

  const done = todays.filter((a) => a.status === "done").length;
  const pct = Math.round((done / todays.length) * 100);

  const distKm =
    next && next.lat && next.lng && position
      ? haversineKm(position, { lat: next.lat, lng: next.lng })
      : null;

  return (
    <div className="rounded-2xl p-4 border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("trackingComp.today.title")}</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("trackingComp.today.stepsPct", { done, total: todays.length, pct })}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {next ? (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-primary/80 font-semibold">
              {t("trackingComp.today.nextStep")}
            </p>
            <p className="text-sm font-semibold text-foreground truncate">{next.title}</p>
            {distKm !== null && (
              <p className="text-xs text-muted-foreground">
                {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                {" · "}~{t("trackingComp.today.walkMins", { mins: Math.max(1, Math.round((distKm / 5) * 60)) })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            {next.lat && next.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${next.lat},${next.lng}`}
                target="_blank"
                rel="noopener"
              >
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <Navigation className="w-3 h-3 mr-1" /> {t("trackingComp.today.go")}
                </Button>
              </a>
            )}
            {next.status !== "in_progress" && (
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => onMarkInProgress(next.id)}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> {t("trackingComp.today.inProgress")}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-green-500 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {t("trackingComp.today.allDone")}
        </p>
      )}
    </div>
  );
};

export default TodayFocus;
