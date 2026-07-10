import { useEffect, useState } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Position } from "@/hooks/useGeolocation";
import { invokeProtectedFunction } from "@/lib/protected-functions";

interface Weather {
  temperature: string;
  conditions: string;
  icon: string;
  feelsLike: string;
  wind: string;
}

interface Props {
  position: Position | null;
  destination?: string;
  onLoaded?: (summary: string) => void;
}

const cache = new Map<string, Weather>();

const LiveWeatherBadge = ({ position, destination, onLoaded }: Props) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const key = position
      ? `${position.lat.toFixed(2)}_${position.lng.toFixed(2)}`
      : destination || null;
    if (!key) return;

    if (cache.has(key)) {
      const w = cache.get(key)!;
      setWeather(w);
      onLoaded?.(`${w.conditions}, ${w.temperature}`);
      return;
    }

    setLoading(true);
    setFailed(false);
    const body = position
      ? { lat: position.lat, lon: position.lng }
      : { city: destination };

    invokeProtectedFunction<Weather>("weather", { body })
      .then(({ data, error }) => {
        if (error || !data || (data as any).error || !data.temperature) {
          setFailed(true);
          return;
        }
        cache.set(key, data);
        setWeather(data);
        onLoaded?.(`${data.conditions}, ${data.temperature}`);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.lat, position?.lng, destination]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/40 text-muted-foreground border border-border">
        <Loader2 className="w-3 h-3 animate-spin" />
        {t("trackingComp.weather.loading")}
      </span>
    );
  }

  if (!weather) {
    if (!failed) return null;
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/40 text-muted-foreground border border-border"
        title={t("trackingComp.weather.unavailableHint")}
      >
        <CloudOff className="w-3 h-3" />
        {t("trackingComp.weather.unavailable")}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/30"
      title={t("trackingComp.weather.feelsLikeWind", { feels: weather.feelsLike, wind: weather.wind })}
    >
      <img
        src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
        alt=""
        className="w-5 h-5 -my-1"
      />
      {weather.temperature} · <span className="capitalize font-normal">{weather.conditions}</span>
    </span>
  );
};

export default LiveWeatherBadge;
