import { Route, MapPin, CheckCircle, TrendingUp } from "lucide-react";
import { TripActivity, TripTracking } from "@/hooks/useTracking";

interface Props {
  tracking: TripTracking | null;
  activities: TripActivity[];
}

const LiveStats = ({ tracking, activities }: Props) => {
  const done = activities.filter((a) => a.status === "done").length;
  const total = activities.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const distance = Number(tracking?.total_distance_km || 0);

  const stats = [
    { icon: Route, label: "Distance", value: `${distance.toFixed(1)} km` },
    { icon: MapPin, label: "Lieux visités", value: done },
    { icon: CheckCircle, label: "Étapes", value: `${done}/${total}` },
    { icon: TrendingUp, label: "Progression", value: `${progress}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="glass-card rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </div>
          <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
        </div>
      ))}
    </div>
  );
};

export default LiveStats;
