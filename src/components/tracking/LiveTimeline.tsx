import { Check, Clock, Circle, MapPin } from "lucide-react";
import { TripActivity } from "@/hooks/useTracking";
import { motion } from "framer-motion";

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
  const grouped = activities.reduce((acc, a) => {
    const key = a.day_date || "Sans date";
    (acc[key] = acc[key] || []).push(a);
    return acc;
  }, {} as Record<string, TripActivity[]>);

  const dates = Object.keys(grouped).sort();

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Aucune activité. Synchronise depuis ton voyage et ton carnet.
      </div>
    );
  }

  const cycle = (s: TripActivity["status"]): TripActivity["status"] =>
    s === "todo" ? "in_progress" : s === "in_progress" ? "done" : "todo";

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <div key={date}>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            {date === "Sans date" ? date : new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </h4>
          <div className="space-y-2">
            {grouped[date].map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-xl p-3 flex items-center gap-3 group"
              >
                <button
                  onClick={() => !readOnly && onStatusChange(a.id, cycle(a.status))}
                  disabled={readOnly}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${
                    a.status === "done" ? "bg-green-500/20 text-green-500" :
                    a.status === "in_progress" ? "bg-amber-500/20 text-amber-500" :
                    "bg-muted text-muted-foreground"
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
                {a.lat && a.lng && <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                {a.source !== "manual" && (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">{a.source}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveTimeline;
