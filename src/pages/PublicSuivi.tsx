import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LiveMap from "@/components/tracking/SimulatedLiveMap";
import LiveTimeline from "@/components/tracking/LiveTimeline";
import LiveStats from "@/components/tracking/LiveStats";
import { TripActivity, TripTracking } from "@/hooks/useTracking";
import { setShareMeta } from "@/lib/seo";

const PublicSuivi = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tracking, setTracking] = useState<TripTracking | null>(null);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [positions, setPositions] = useState<{ lat: number; lng: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancel = false;
    const load = async () => {
      const { data: tRows } = await (supabase as any).rpc("get_public_trip_tracking", { _slug: slug });
      const t = Array.isArray(tRows) ? tRows[0] : tRows;
      if (cancel || !t) { setLoading(false); return; }
      setTracking(t as TripTracking);
      setShareMeta({
        title: "Suivi de voyage en direct",
        description: `Suis ce voyage en temps réel · ${Number(t.total_distance_km || 0).toFixed(1)} km parcourus`,
        ogKind: "suivi",
        slug: slug!,
      });
      const [{ data: a }, { data: p }] = await Promise.all([
        (supabase as any).rpc("get_public_trip_activities", { _slug: slug }),
        (supabase as any).rpc("get_public_trip_positions", { _slug: slug }),
      ]);
      setActivities((a || []) as TripActivity[]);
      setPositions((p || []) as { lat: number; lng: number }[]);
      setLoading(false);
    };
    load();
    const poll = setInterval(load, 15000);
    return () => { cancel = true; clearInterval(poll); };
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!tracking) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Lien introuvable ou désactivé</p></div>;
  }

  const livePos = tracking.last_lat && tracking.last_lng
    ? { lat: tracking.last_lat, lng: tracking.last_lng, accuracy: 0, speed: null, timestamp: 0 }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border backdrop-blur-md bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="font-bold">Suivi de voyage public</h1>
          <span className={`ml-2 w-2 h-2 rounded-full ${tracking.is_active ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-4">
        <LiveMap position={livePos} activities={activities} positions={positions} height="500px" />
        <LiveStats tracking={tracking} activities={activities} />
        <LiveTimeline activities={activities} onStatusChange={() => {}} readOnly />
      </main>
    </div>
  );
};

export default PublicSuivi;
