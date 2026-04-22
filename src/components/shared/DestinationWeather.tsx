// ✨ NEW — Météo destination (réutilise edge function `weather`)
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Cloud, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setLoading(true);
    // Extract first city/country segment
    const city = destination.split(",")[0].trim();
    supabase.functions
      .invoke("weather", { body: { city } })
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setData(data);
      })
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

  if (!data || data.fallback || !data.temperature) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Cloud className="w-3.5 h-3.5" /> {t("weatherWidget.unavailable")}
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
