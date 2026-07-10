// ✨ NEW — Météo destination (réutilise edge function `weather`)
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { invokeProtectedFunction } from "@/lib/protected-functions";

interface Props {
  destination?: string | null;
  compact?: boolean;
}

interface WeatherData {
  temperature?: string;
  conditions?: string;
  icon?: string;
  humidity?: string;
  wind?: string;
  fallback?: boolean;
}

const DestinationWeather = ({ destination, compact }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    const city = destination.split(",")[0].trim();
    invokeProtectedFunction<WeatherData>("weather", { body: { city } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || data.fallback || !data.temperature) {
          setFailed(true);
          setData(null);
          return;
        }
        setData(data);
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [destination]);

  if (!destination) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("weatherWidget.loading")}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-muted-foreground"
        title={failed ? t("trackingComp.weather.unavailableHint") : undefined}
      >
        {failed ? <CloudOff className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
        {t("weatherWidget.unavailable")}
      </div>
    );
  }

  const iconUrl = data.icon ? `https://openweathermap.org/img/wn/${data.icon}@2x.png` : null;

  return (
    <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      {iconUrl ? (
        <img src={iconUrl} alt="" className={compact ? "w-7 h-7" : "w-9 h-9"} />
      ) : (
        <Cloud className="w-4 h-4 text-primary" />
      )}
      <div className="leading-tight">
        <div className="font-semibold">{data.temperature}</div>
        <div className="text-[11px] text-muted-foreground capitalize">{data.conditions}</div>
      </div>
    </div>
  );
};

export default DestinationWeather;
