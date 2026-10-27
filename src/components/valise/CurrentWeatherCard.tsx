// Real current weather + next days (OpenWeatherMap through the weather function). Never invented:
// on error nothing replaces the data, the student is told it is unavailable.
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Droplets, Loader2, RefreshCw, Snowflake, Sun, Wind } from "lucide-react";
import { invokeProtectedFunction } from "@/lib/protected-functions";
import { Button } from "@/components/ui/button";

interface WeatherNow {
  fallback?: boolean;
  error?: string;
  current?: { temp: number; feelsLike: number; humidity: number; windKmh: number; description: string; icon: string; observedAt: string; timezoneOffset: number };
  forecast?: Array<{ date: string; tmin: number; tmax: number; description: string; icon: string }>;
  place?: { name: string; country: string };
  source?: { name: string; url: string };
}

interface Props { city: string; countryCode: string | null }

// Icons drawn locally: the weather provider never receives the student's IP address.
function WeatherIcon({ code, className }: { code: string; className?: string }) {
  const k = code.slice(0, 2);
  const Icon = k === "01" ? Sun : k === "02" ? CloudSun : k === "09" || k === "10" ? CloudRain : k === "11" ? CloudLightning : k === "13" ? Snowflake : k === "50" ? CloudFog : Cloud;
  return <Icon className={className} aria-hidden />;
}

const CurrentWeatherCard = ({ city, countryCode }: Props) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("en") ? "en" : "fr";
  const locale = lang === "fr" ? "fr-FR" : "en-GB";
  const q = useQuery({
    queryKey: ["weather-now", city, countryCode, lang],
    enabled: city.length >= 2,
    staleTime: 15 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await invokeProtectedFunction<WeatherNow>("weather", { body: { city, countryCode, lang } });
      if (error) throw error;
      return data as WeatherNow;
    },
  });
  const d = q.data;
  const c = d?.current;
  // Local time at the place: UTC + the offset given by the station.
  const localTime = c ? new Date(new Date(c.observedAt).getTime() + c.timezoneOffset * 1000).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : "";
  const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, { weekday: "short", day: "numeric", timeZone: "UTC" });

  return (
    <section aria-labelledby="weather-now-title" className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CloudSun className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <h3 id="weather-now-title" className="text-base font-bold">{t("valise3.weather.title", { place: d?.place?.name || city })}</h3>
            <p className="text-xs text-muted-foreground">{t("valise3.weather.subtitle")}</p>
          </div>
        </div>
        {c && (
          <button type="button" onClick={() => void q.refetch()} disabled={q.isFetching} aria-label={t("valise3.weather.retry")} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {q.isLoading && <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("valise3.weather.loading")}</p>}
      {!q.isLoading && (q.isError || (d?.fallback && d.error !== "city_not_found") || (d && !d.fallback && !c)) && (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t("valise3.weather.unavailable")}</p>
          <Button size="sm" variant="outline" onClick={() => void q.refetch()}>{t("valise3.weather.retry")}</Button>
        </div>
      )}
      {d?.fallback && d.error === "city_not_found" && <p className="text-sm text-muted-foreground">{t("valise3.weather.notFound", { city })}</p>}

      {c && (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <WeatherIcon code={c.icon} className="h-12 w-12 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t("valise3.weather.now")}</p>
                <p className="text-3xl font-extrabold tabular-nums">{c.temp}°C</p>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-semibold capitalize">{c.description}</p>
              <p className="text-xs text-muted-foreground">{t("valise3.weather.feels", { t: c.feelsLike })}</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" aria-hidden />{t("valise3.weather.humidity")} {c.humidity} %</span>
              <span className="inline-flex items-center gap-1"><Wind className="h-3.5 w-3.5" aria-hidden />{t("valise3.weather.wind")} {c.windKmh} km/h</span>
            </div>
          </div>
          {!!d?.forecast?.length && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("valise3.weather.forecast")}</p>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {d.forecast.map((f) => (
                  <li key={f.date} className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5">
                    <WeatherIcon code={f.icon} className="h-7 w-7 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold capitalize">{dayLabel(f.date)}</p>
                      <p className="text-sm font-bold tabular-nums">{f.tmin}° / {f.tmax}°</p>
                      <p className="truncate text-[11px] capitalize text-muted-foreground">{f.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            {t("valise3.weather.updated", { time: localTime })}{" "}
            <a href={d?.source?.url || "https://openweathermap.org/"} target="_blank" rel="noopener noreferrer" className="underline">{d?.source?.name || "OpenWeatherMap"}</a>
            {d?.place?.name ? ` · ${d.place.name}` : ""}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{t("valise3.weather.seasonalNote")}</p>
        </>
      )}
    </section>
  );
};

export default CurrentWeatherCard;
