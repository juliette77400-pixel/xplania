import { Play, Pause, Bell, Share2, RefreshCw, BatteryLow, Zap, Battery } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TripTracking } from "@/hooks/useTracking";

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
  const { t } = useTranslation();
  const precision = tracking?.settings?.precision || "balanced";

  const precisionOptions = [
    { v: "high", icon: Zap, label: t("trackingComp.controls.precHigh") },
    { v: "balanced", icon: Battery, label: t("trackingComp.controls.precBalanced") },
    { v: "low", icon: BatteryLow, label: t("trackingComp.controls.precLow") },
  ] as const;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("trackingComp.controls.kicker")}</p>
          <p className="font-bold text-foreground flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${tracking?.is_active ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            {tracking?.is_active ? t("trackingComp.controls.active") : t("trackingComp.controls.paused")}
            {!isOnline && <span className="text-xs text-amber-500">• {t("trackingComp.controls.offline")}</span>}
          </p>
        </div>
        {tracking?.is_active ? (
          <Button onClick={onStop} variant="outline" size="sm">
            <Pause className="w-4 h-4" /> {t("trackingComp.controls.stop")}
          </Button>
        ) : (
          <Button onClick={() => onStart(precision)} size="sm" className="gradient-button">
            <Play className="w-4 h-4" /> {t("trackingComp.controls.start")}
          </Button>
        )}
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">{t("trackingComp.controls.precision")}</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {precisionOptions.map(({ v, icon: Icon, label }) => (
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{t("trackingComp.controls.notifications")}</span>
        </div>
        {notifGranted ? (
          <span className="text-xs text-green-500">{t("trackingComp.controls.enabled")}</span>
        ) : (
          <Button onClick={onRequestNotifications} variant="outline" size="sm">{t("trackingComp.controls.enable")}</Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{t("trackingComp.controls.shareMyPos")}</span>
          </div>
          <Switch
            checked={!!tracking?.share_enabled}
            onCheckedChange={onToggleShare}
          />
        </div>
        {onOpenShare && (
          <Button onClick={onOpenShare} variant="outline" size="sm" className="w-full">
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> {t("trackingComp.controls.qrLink")}
          </Button>
        )}
      </div>

      <Button onClick={onSeed} variant="outline" size="sm" className="w-full">
        <RefreshCw className="w-4 h-4" /> {t("trackingComp.controls.syncTrip")}
      </Button>
    </div>
  );
};

export default TrackingControls;
