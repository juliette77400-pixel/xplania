import { useEffect, useMemo, useState } from "react";
import { useTracking } from "@/hooks/useTracking";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useNotifications } from "@/hooks/useNotifications";
import { useOfflineCache, readCache } from "@/hooks/useOfflineCache";
import LiveMap from "./LiveMap";
import LiveTimeline from "./LiveTimeline";
import LiveStats from "./LiveStats";
import LiveSuggestions from "./LiveSuggestions";
import TrackingControls from "./TrackingControls";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Props {
  tripId: string;
  destination?: string;
}

const FILTERS = ["all", "food", "culture", "nature", "shopping", "nightlife", "hidden_gem"] as const;

const TripTracker = ({ tripId, destination }: Props) => {
  const tracking = useTracking(tripId);
  const { tracking: t, activities, positions } = tracking;
  const [filter, setFilter] = useState<string>("all");

  const precision = (t?.settings?.precision || "balanced") as "high" | "balanced" | "low";

  const geo = useGeolocation({
    enabled: !!t?.is_active,
    precision,
    onPosition: (p) => tracking.recordPosition(p),
  });

  const notif = useNotifications();
  useCheckIn(tripId, geo.position, activities, (a) => notif.notify("Check-in automatique", a.title));
  const { isOnline } = useOfflineCache(tripId, t, activities);

  // Hydrate from cache if offline & nothing loaded
  const [cacheActivities, setCacheActivities] = useState(activities);
  useEffect(() => {
    if (!isOnline && activities.length === 0) {
      const c = readCache(tripId);
      if (c) setCacheActivities(c.activities);
    } else {
      setCacheActivities(activities);
    }
  }, [isOnline, activities, tripId]);

  const displayActivities = isOnline ? activities : cacheActivities;
  const mapFilter = filter === "all" ? undefined : filter;

  // Auto-seed if empty
  useEffect(() => {
    if (!tracking.loading && t && activities.length === 0) {
      tracking.seedActivities().then((n) => {
        if (n > 0) toast.success(`${n} étapes synchronisées depuis ton voyage`);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking.loading, t]);

  if (tracking.loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Chargement…</div>;
  }

  return (
    <div className="space-y-4">
      {geo.error && (
        <div className="rounded-xl p-3 bg-amber-500/10 text-amber-600 text-sm border border-amber-500/30">
          ⚠️ {geo.error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs capitalize transition ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {f === "all" ? "Tout" : f.replace("_", " ")}
              </button>
            ))}
          </div>

          <LiveMap
            position={geo.position}
            activities={displayActivities}
            positions={positions}
            filter={mapFilter}
            height="450px"
          />

          <LiveStats tracking={t} activities={displayActivities} />
        </div>

        <div className="space-y-4">
          <TrackingControls
            tracking={t}
            isOnline={isOnline}
            onStart={tracking.startTracking}
            onStop={tracking.stopTracking}
            onPrecisionChange={tracking.updatePrecision}
            onToggleShare={tracking.toggleShare}
            onRequestNotifications={notif.request}
            onSeed={async () => {
              const n = await tracking.seedActivities();
              toast.success(`${n} étapes synchronisées`);
            }}
            notifGranted={notif.permission === "granted"}
          />
        </div>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="timeline">📋 Timeline live</TabsTrigger>
          <TabsTrigger value="suggestions">✨ Suggestions IA</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <LiveTimeline activities={displayActivities} onStatusChange={tracking.updateActivityStatus} />
        </TabsContent>
        <TabsContent value="suggestions" className="mt-4">
          <LiveSuggestions position={geo.position} destination={destination} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TripTracker;
