import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CloudSun, CloudOff, Thermometer, Droplets, Wind, RefreshCw, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cleanCityForWeather } from "@/lib/geocoding";
import { toast } from "sonner";
import { invokeProtectedFunction } from "@/lib/protected-functions";

export interface WeatherInfo {
  temperature?: string;
  feelsLike?: string;
  humidity?: string;
  wind?: string;
  conditions?: string;
  icon?: string;
  advice: string[];
}

interface WeatherSectionProps {
  destination: string;
}

const WeatherSection = ({ destination }: WeatherSectionProps) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!destination || destination === "votre destination" || destination.toLowerCase().includes("your destination")) return;
    setLoading(true);
    setError(null);
    try {
      const cleanCity = cleanCityForWeather(destination);
      if (!cleanCity || cleanCity.length < 2) {
        setLoading(false);
        return;
      }
      const { data, error: fnError } = await invokeProtectedFunction<WeatherInfo & { fallback?: boolean; error?: string }>("weather", {
        body: { city: cleanCity },
      });
      if (fnError) throw fnError;
      if (data?.fallback) {
        setWeather(data as WeatherInfo);
        return;
      }
      if (data?.error) throw new Error(data.error);
      setWeather(data as WeatherInfo);
    } catch (e: any) {
      console.error("Weather fetch error:", e);
      setError(t("valise.weatherFetchError"));
      // Fallback data
      setWeather({
        temperature: "—",
        humidity: "—",
        wind: "—",
        conditions: t("valise.weatherUnavailable"),
        advice: [t("valise.weatherCheckManually")],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [destination]);

  const handleRefresh = () => {
    toast.loading(t("valise.weatherUpdating"), { id: "weather" });
    fetchWeather().then(() => toast.success(t("valise.weatherUpdated"), { id: "weather" }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CloudSun className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">{t("valise.weatherTitle")}</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{destination}</p>

      {loading && !weather ? (
        <div className="flex items-center gap-3 py-8 justify-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">{t("valise.weatherLoading")}</p>
        </div>
      ) : weather ? (
        <>
          {/* Weather icon + temperature hero */}
          {weather.temperature && weather.temperature !== "—" && (
            <div className="flex items-center gap-4 mb-4">
              {weather.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.conditions || "météo"}
                  className="w-16 h-16"
                />
              )}
              <div>
                <p className="text-3xl font-bold text-foreground">{weather.temperature}</p>
                <p className="text-sm text-muted-foreground capitalize">{weather.conditions}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {weather.temperature && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <Thermometer className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">{t("valise.weatherTemp")}</p>
                  <p className="text-sm font-semibold text-foreground">{weather.temperature}</p>
                </div>
              </div>
            )}
            {weather.feelsLike && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <Thermometer className="w-4 h-4 text-secondary" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">{t("valise.weatherFeel")}</p>
                  <p className="text-sm font-semibold text-foreground">{weather.feelsLike}</p>
                </div>
              </div>
            )}
            {weather.humidity && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <Droplets className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">{t("valise.weatherHumidity")}</p>
                  <p className="text-sm font-semibold text-foreground">{weather.humidity}</p>
                </div>
              </div>
            )}
            {weather.wind && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <Wind className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">{t("valise.weatherWind")}</p>
                  <p className="text-sm font-semibold text-foreground">{weather.wind}</p>
                </div>
              </div>
            )}
          </div>

          {weather.advice.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("valise.weatherTipsTitle")}
              </p>
              {weather.advice.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                  <span className="text-primary text-sm mt-0.5">💡</span>
                  <p className="text-sm text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleRefresh}
            className="mt-4 text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            {t("valise.weatherRefreshCta")}
          </button>
        </>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
          <CloudOff className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">{t("trackingComp.weather.unavailableHint")}</p>
            <button
              onClick={handleRefresh}
              className="mt-1 text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              {t("valise.weatherRefreshCta")}
            </button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default WeatherSection;
