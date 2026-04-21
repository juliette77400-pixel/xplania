import { Check, Clock, Circle, MapPin, ArrowDown, Footprints } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TripActivity } from "@/hooks/useTracking";
import { motion } from "framer-motion";
import { haversineKm } from "@/hooks/useGeolocation";

interface Props {
  activities: TripActivity[];
  onStatusChange: (id: string, status: TripActivity["status"]) => void;
  readOnly?: boolean;
}

const statusIcon = {
  done: <Check className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  todo: <Circle className="w-4 h-4" />,
};

const LiveTimeline = ({ activities, onStatusChange, readOnly }: Props) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  function estimateDuration(km: number) {
    const minutes = Math.round((km / 5) * 60);
    if (minutes < 1) return t("trackingComp.timeline.less1m");
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, "0")}`;
  }

  const grouped = activities.reduce((acc, a) => {
    const key = a.day_date || t("trackingComp.timeline.noDate");
    (acc[key] = acc[key] || []).push(a);
    return acc;
  }, {} as Record<string, TripActivity[]>);

  const dates = Object.keys(grouped).sort();
  const noDateLabel = t("trackingComp.timeline.noDate");

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {t("trackingComp.timeline.noActivities")}
      </div>
    );
  }

  const cycle = (s: TripActivity["status"]): TripActivity["status"] =>
    s === "todo" ? "in_progress" : s === "in_progress" ? "done" : "todo";

  return (
    <div className="space-y-8">
      {dates.map((date) => {
        const items = grouped[date];
        const doneCount = items.filter((i) => i.status === "done").length;
        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {date === noDateLabel
                  ? date
                  : new Date(date).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}
              </h4>
              <span className="text-[11px] text-muted-foreground">
                {t("trackingComp.timeline.stepsCount", { count: items.length, done: doneCount, total: items.length })}
              </span>
            </div>

            <div className="relative pl-3">
              <div className="absolute left-[19px] top-1 bottom-1 w-px bg-gradient-to-b from-primary/40 via-border to-primary/10" />

              <div className="space-y-3">
                {items.map((a, i) => {
                  const next = items[i + 1];
                  const distKm =
                    a.lat && a.lng && next?.lat && next?.lng
                      ? haversineKm({ lat: a.lat, lng: a.lng }, { lat: next.lat, lng: next.lng })
                      : null;

                  return (
                    <div key={a.id}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="glass-card rounded-xl p-3 flex items-center gap-3 group relative"
                      >
                        <span className="absolute -left-1.5 top-3 text-[10px] font-bold text-muted-foreground bg-background px-1 rounded">
                          {i + 1}
                        </span>

                        <button
                          onClick={() => !readOnly && onStatusChange(a.id, cycle(a.status))}
                          disabled={readOnly}
                          aria-label={t("trackingComp.timeline.statusAria", { status: a.status })}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition border-2 ${
                            a.status === "done"
                              ? "bg-green-500/20 text-green-500 border-green-500/40"
                              : a.status === "in_progress"
                              ? "bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {statusIcon[a.status]}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${a.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {a.title}
                          </p>
                          {a.description && <p className="text-xs text-muted-foreground truncate">{a.description}</p>}
                        </div>

                        {a.lat && a.lng && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`}
                            target="_blank"
                            rel="noopener"
                            className="opacity-0 group-hover:opacity-100 transition text-primary"
                            title={t("trackingComp.timeline.directions")}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {a.source !== "manual" && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">{a.source}</span>
                        )}
                      </motion.div>

                      {distKm !== null && distKm > 0.05 && (
                        <div className="flex items-center gap-2 ml-12 my-1.5 text-[11px] text-muted-foreground">
                          <ArrowDown className="w-3 h-3 text-primary/60" />
                          <Footprints className="w-3 h-3" />
                          <span className="font-mono">{distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}</span>
                          <span className="text-muted-foreground/60">•</span>
                          <span>~{estimateDuration(distKm)} {t("trackingComp.timeline.byFoot")}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LiveTimeline;
