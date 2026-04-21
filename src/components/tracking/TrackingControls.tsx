import { Play, Pause, Bell, Share2, Copy, RefreshCw, BatteryLow, Zap, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TripTracking } from "@/hooks/useTracking";
import { toast } from "sonner";

interface Props {
  tracking: TripTracking | null;
  isOnline: boolean;
  onStart: (precision: "high" | "balanced" | "low") => void;
  onStop: () => void;
  onPrecisionChange: (p: "high" | "balanced" | "low") => void;
  onToggleShare: (enabled: boolean) => void;
  onOpenShare?: () => void;
  onRequestNotifications: () => void;
  onSeed: () => void;
  notifGranted: boolean;
}

const TrackingControls = ({
  tracking, isOnline, onStart, onStop, onPrecisionChange,
  onToggleShare, onOpenShare, onRequestNotifications, onSeed, notifGranted,
}: Props) => {
  const precision = tracking?.settings?.precision || "balanced";
  const shareUrl = tracking?.share_slug
    ? `${window.location.origin}/suivi/public/${tracking.share_slug}` : "";

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié");
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Suivi en direct</p>
          <p className="font-bold text-foreground flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${tracking?.is_active ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            {tracking?.is_active ? "Actif" : "En pause"}
            {!isOnline && <span className="text-xs text-amber-500">• Hors ligne</span>}
          </p>
        </div>
        {tracking?.is_active ? (
          <Button onClick={onStop} variant="outline" size="sm">
            <Pause className="w-4 h-4" /> Arrêter
          </Button>
        ) : (
          <Button onClick={() => onStart(precision)} size="sm" className="gradient-button">
            <Play className="w-4 h-4" /> Démarrer
          </Button>
        )}
      </div>

      {/* Precision */}
      <div>
        <Label className="text-xs text-muted-foreground">Précision GPS</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {([
            { v: "high", icon: Zap, label: "Haute" },
            { v: "balanced", icon: Battery, label: "Équilibré" },
            { v: "low", icon: BatteryLow, label: "Éco" },
          ] as const).map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              onClick={() => onPrecisionChange(v)}
              className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition border ${
                precision === v ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">Notifications</span>
        </div>
        {notifGranted ? (
          <span className="text-xs text-green-500">Activées</span>
        ) : (
          <Button onClick={onRequestNotifications} variant="outline" size="sm">Activer</Button>
        )}
      </div>

      {/* Share */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Partager ma position</span>
          </div>
          <Switch
            checked={!!tracking?.share_enabled}
            onCheckedChange={onToggleShare}
          />
        </div>
        {onOpenShare && (
          <Button onClick={onOpenShare} variant="outline" size="sm" className="w-full">
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> QR code & lien
          </Button>
        )}
      </div>

      {/* Seed */}
      <Button onClick={onSeed} variant="outline" size="sm" className="w-full">
        <RefreshCw className="w-4 h-4" /> Synchroniser depuis le voyage
      </Button>
    </div>
  );
};

export default TrackingControls;
