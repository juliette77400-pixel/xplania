import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTracking } from "@/hooks/useTracking";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useNotifications } from "@/hooks/useNotifications";
import { useOfflineCache, readCache } from "@/hooks/useOfflineCache";
import { useNearbyPOI, NearbyPOI, POI_COLORS, POI_LABELS } from "@/hooks/useNearbyPOI";
import { useJournal } from "@/hooks/useJournal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import FakeMapView from "./FakeMapView";
import LiveTimeline from "./LiveTimeline";
import LiveStats from "./LiveStats";
import LiveSuggestions, { AISuggestion } from "./LiveSuggestions";
import TrackingControls from "./TrackingControls";
import LiveWeatherBadge from "./LiveWeatherBadge";
import TodayFocus from "./TodayFocus";
import ShareTripDialog from "./ShareTripDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Activity, MapPin, Radio, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  tripId: string;
  destination?: string;
}

const FILTERS = ["all", "food", "culture", "nature", "shopping", "nightlife", "hidden_gem"] as const;

const TripTracker = ({ tripId, destination }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const tracking = useTracking(tripId);
  const { tracking: trip, activities, positions } = tracking;
  const { journal, days, refetch: refetchJournal } = useJournal(tripId);
  const [filter, setFilter] = useState<string>("all");
  const [showPois, setShowPois] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [weatherSummary, setWeatherSummary] = useState<string | undefined>();
  const [shareOpen, setShareOpen] = useState(false);

  const precision = (trip?.settings?.precision || "balanced") as "high" | "balanced" | "low";

  const geo = useGeolocation({
    enabled: !!trip?.is_active,
    precision,
    onPosition: (p) => tracking.recordPosition(p),
  });

  const notif = useNotifications();
  useCheckIn(tripId, geo.position, activities, (a) => notif.notify("Check-in automatique", a.title));
  const { isOnline } = useOfflineCache(tripId, trip, activities);

  const { pois, loading: loadingPois } = useNearbyPOI(geo.position, showPois && !!geo.position, 600);

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

  const aiPins = useMemo(
    () =>
      aiSuggestions
        .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
        .map((s) => ({
          title: s.title,
          category: s.category,
          description: s.description,
          reason: s.reason,
          lat: s.lat as number,
          lng: s.lng as number,
        })),
    [aiSuggestions]
  );

  useEffect(() => {
    if (!tracking.loading && trip && activities.length === 0) {
      tracking.seedActivities().then((n) => {
        if (n > 0) toast.success(`${n} étapes synchronisées depuis ton voyage`);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking.loading, trip]);

  /**
   * S1 — Real Carnet add: resolve today's journal_day (or first day),
   * insert a journal_blocks row of type "place" with full payload.
   */
  const addToCarnet = async (payload: {
    title: string;
    description?: string;
    lat?: number | null;
    lng?: number | null;
    category?: string;
    source: "poi" | "ai";
  }) => {
    if (!user) {
      toast.error("Connecte-toi pour ajouter à ton carnet");
      return;
    }
    if (!journal || days.length === 0) {
      toast.error("Carnet pas encore prêt — patiente un instant");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const targetDay =
      days.find((d) => d.date === today) ||
      days.find((d) => d.date >= today) ||
      days[days.length - 1];

    const position = (targetDay.blocks?.length || 0);

    const { error } = await supabase.from("journal_blocks").insert({
      journal_id: journal.id,
      day_id: targetDay.id,
      user_id: user.id,
      type: "place",
      position,
      content: {
        title: payload.title,
        description: payload.description || "",
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        category: payload.category || null,
        source: payload.source,
        added_from: "suivi",
      },
    });

    if (error) {
      toast.error("Impossible d'ajouter au carnet");
      return;
    }

    toast.success(`✨ "${payload.title}" ajouté à ton carnet`, {
      description: `Jour du ${new Date(targetDay.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`,
      action: { label: "Voir", onClick: () => window.open(`/carnet/${tripId}`, "_blank") },
    });
    refetchJournal();
  };

  const handlePoiAdd = (poi: NearbyPOI) =>
    addToCarnet({
      title: poi.name,
      description: poi.tags["addr:street"] || "",
      lat: poi.lat,
      lng: poi.lng,
      category: poi.category,
      source: "poi",
    });

  const handleAiAdd = (s: AISuggestion) =>
    addToCarnet({
      title: s.title,
      description: `${s.description}${s.reason ? ` — ${s.reason}` : ""}`,
      lat: s.lat,
      lng: s.lng,
      category: s.category,
      source: "ai",
    });

  const shareUrl = trip?.share_slug ? `${window.location.origin}/suivi/public/${trip.share_slug}` : "";

  if (tracking.loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Chargement…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Immersive hero with live weather */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-background to-accent/10 p-6">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80 font-semibold flex items-center gap-2 mb-2">
              <Radio className={`w-3.5 h-3.5 ${trip?.is_active ? "text-green-500 animate-pulse" : ""}`} />
              {t("trackingComp.tracker.kicker")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              {destination || t("trackingComp.tracker.myTrip")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {trip?.is_active
                ? t("trackingComp.tracker.positionShared", { km: Number(trip?.total_distance_km || 0).toFixed(1) })
                : t("trackingComp.tracker.enableGeo")}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <LiveWeatherBadge
                position={geo.position}
                destination={destination}
                onLoaded={setWeatherSummary}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              trip?.is_active
                ? "bg-green-500/10 text-green-500 border-green-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              <Activity className="inline w-3 h-3 mr-1" />
              {trip?.is_active ? "EN DIRECT" : "EN PAUSE"}
            </span>
            {!isOnline && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                Hors ligne
              </span>
            )}
            <Button size="sm" variant="outline" onClick={() => setShareOpen(true)} className="h-8">
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> Partager
            </Button>
          </div>
        </div>
      </div>

      {geo.error && (
        <div className="rounded-xl p-3 bg-amber-500/10 text-amber-600 text-sm border border-amber-500/30">
          ⚠️ {geo.error}
        </div>
      )}

      {/* S3 — Today's focus */}
      <TodayFocus
        activities={displayActivities}
        position={geo.position}
        onMarkInProgress={(id) => tracking.updateActivityStatus(id, "in_progress")}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
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

          <FakeMapView
            destination={destination}
            progressKm={Number(trip?.total_distance_km || 0)}
            totalKm={Number((trip as any)?.target_distance_km || 0) || undefined}
            stages={displayActivities.map((a) => ({
              id: a.id,
              title: a.title,
              status: a.status,
            }))}
            height={420}
          />

          {showPois && pois.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground px-1">
              <span className="font-semibold">{filteredPois.length} POI autour</span>
              {(Object.entries(POI_LABELS) as [keyof typeof POI_LABELS, string][]).map(([cat, label]) => (
                <span key={cat} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: POI_COLORS[cat] }} />
                  {label}
                </span>
              ))}
              {aiPins.length > 0 && (
                <span className="flex items-center gap-1 ml-2">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-400" style={{ background: "#f59e0b" }} />
                  ✨ Suggestions IA
                </span>
              )}
            </div>
          )}

          <LiveStats tracking={trip} activities={displayActivities} />
        </div>

        <div className="space-y-4">
          <TrackingControls
            tracking={trip}
            isOnline={isOnline}
            onStart={tracking.startTracking}
            onStop={tracking.stopTracking}
            onPrecisionChange={tracking.updatePrecision}
            onToggleShare={tracking.toggleShare}
            onOpenShare={() => setShareOpen(true)}
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
          <LiveSuggestions
            position={geo.position}
            destination={destination}
            weather={weatherSummary}
            suggestions={aiSuggestions}
            onSuggestions={(s) => {
              setAiSuggestions(s);
              const withPin = s.filter((x) => x.lat && x.lng).length;
              if (withPin > 0) toast.success(`${withPin} suggestion${withPin > 1 ? "s" : ""} épinglée${withPin > 1 ? "s" : ""} sur la carte ⭐`);
            }}
            onAddToCarnet={handleAiAdd}
          />
        </TabsContent>
      </Tabs>

      <ShareTripDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        shareEnabled={!!trip?.share_enabled}
        shareUrl={shareUrl}
        destination={destination}
        onToggle={tracking.toggleShare}
      />
    </div>
  );
};

export default TripTracker;
