import { useEffect, useState } from "react";
import { useTracking } from "@/hooks/useTracking";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useNotifications } from "@/hooks/useNotifications";
import { useOfflineCache, readCache } from "@/hooks/useOfflineCache";
import { useNearbyPOI, NearbyPOI, POI_COLORS, POI_LABELS } from "@/hooks/useNearbyPOI";
import LiveMap from "./LiveMap";
import LiveTimeline from "./LiveTimeline";
import LiveStats from "./LiveStats";
import LiveSuggestions from "./LiveSuggestions";
import TrackingControls from "./TrackingControls";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity, MapPin, Radio } from "lucide-react";
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
  const [showPois, setShowPois] = useState(true);

  const precision = (t?.settings?.precision || "balanced") as "high" | "balanced" | "low";

  const geo = useGeolocation({
    enabled: !!t?.is_active,
    precision,
    onPosition: (p) => tracking.recordPosition(p),
  });

  const notif = useNotifications();
  useCheckIn(tripId, geo.position, activities, (a) => notif.notify("Check-in automatique", a.title));
  const { isOnline } = useOfflineCache(tripId, t, activities);

  const { pois, loading: loadingPois } = useNearbyPOI(geo.position, showPois && !!geo.position, 600);

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
  const filteredPois = filter === "all" ? pois : pois.filter((p) => p.category === filter);

  // Auto-seed if empty
  useEffect(() => {
    if (!tracking.loading && t && activities.length === 0) {
      tracking.seedActivities().then((n) => {
        if (n > 0) toast.success(`${n} étapes synchronisées depuis ton voyage`);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking.loading, t]);

  const handlePoiAdd = (poi: NearbyPOI) => {
    toast.success(`"${poi.name}" prêt à être ajouté à ton carnet`, {
      description: "Ouvre l'onglet Carnet pour finaliser l'ajout.",
    });
  };

  if (tracking.loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Chargement…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Immersive hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-background to-accent/10 p-6">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80 font-semibold flex items-center gap-2 mb-2">
              <Radio className={`w-3.5 h-3.5 ${t?.is_active ? "text-green-500 animate-pulse" : ""}`} />
              Suivi de voyage en direct
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              {destination || "Mon voyage"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t?.is_active
                ? `Position partagée • ${Number(t.total_distance_km || 0).toFixed(1)} km parcourus`
                : "Active la géolocalisation pour démarrer le suivi temps réel"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              t?.is_active
                ? "bg-green-500/10 text-green-500 border-green-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              <Activity className="inline w-3 h-3 mr-1" />
              {t?.is_active ? "EN DIRECT" : "EN PAUSE"}
            </span>
            {!isOnline && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                Hors ligne
              </span>
            )}
          </div>
        </div>
      </div>

      {geo.error && (
        <div className="rounded-xl p-3 bg-amber-500/10 text-amber-600 text-sm border border-amber-500/30">
          ⚠️ {geo.error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Filters + POI toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize transition border ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 border-border"
                  }`}
                >
                  {f === "all" ? "Tout" : POI_LABELS[f as keyof typeof POI_LABELS] || f.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="poi-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Points d'intérêt {loadingPois && "…"}
              </Label>
              <Switch id="poi-toggle" checked={showPois} onCheckedChange={setShowPois} />
            </div>
          </div>

          <LiveMap
            position={geo.position}
            activities={displayActivities}
            positions={positions}
            filter={mapFilter}
            height="500px"
            pois={showPois ? filteredPois : []}
            onPoiAddToCarnet={handlePoiAdd}
          />

          {/* POI legend */}
          {showPois && pois.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground px-1">
              <span className="font-semibold">{filteredPois.length} POI autour</span>
              {(Object.entries(POI_LABELS) as [keyof typeof POI_LABELS, string][]).map(([cat, label]) => (
                <span key={cat} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: POI_COLORS[cat] }} />
                  {label}
                </span>
              ))}
            </div>
          )}

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
          <TabsTrigger value="timeline">📋 Timeline du voyage</TabsTrigger>
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
