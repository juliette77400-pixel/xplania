import { useEffect, useState } from "react";
import { Bell, BellOff, Compass, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { timeOfDay } from "@/lib/discover";

interface Props {
  userPos: { lat: number; lng: number } | null;
  weather: string | null;
  loading: boolean;
  onRefresh: () => void;
}

const TOD_LABEL: Record<string, string> = { morning: "Matinée", afternoon: "Après-midi", evening: "Soirée", night: "Nuit" };

const DiscoverHero = ({ userPos, weather, loading, onRefresh }: Props) => {
  const { permission, request } = useNotifications();
  const [tod, setTod] = useState(timeOfDay());
  useEffect(() => { const i = setInterval(() => setTod(timeOfDay()), 60000); return () => clearInterval(i); }, []);

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card/60 to-accent/10 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Compass className="h-3.5 w-3.5" />
            <span>Discover</span>
            <span>•</span>
            <span>{TOD_LABEL[tod]}</span>
            {weather && <><span>•</span><span>🌤 {weather}</span></>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ce qu'il te faut <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">maintenant</span>
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {userPos ? `Autour de toi (${userPos.lat.toFixed(3)}, ${userPos.lng.toFixed(3)})` : "Active la géolocalisation pour des recos précises"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading || !userPos}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser
          </Button>
          {permission !== "granted" ? (
            <Button size="sm" variant="ghost" onClick={request}>
              <Bell className="mr-2 h-4 w-4" />Activer les alertes
            </Button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Bell className="h-3 w-3" />Alertes actives</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverHero;
