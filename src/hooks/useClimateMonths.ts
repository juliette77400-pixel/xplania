// Usual weather for the stay months (Open-Meteo archive via the climate-months function).
// Shared by the Valise climate block and the AI tips/outfits, which receive these real figures.
import { useQuery } from "@tanstack/react-query";
import { invokeProtectedFunction } from "@/lib/protected-functions";
import type { ClimateMonth } from "@/lib/valise-profiles";

export interface ClimateResult {
  status: "ok" | "not_found" | "unavailable";
  planned?: boolean;
  place?: { name: string; region: string; country: string };
  observed?: { from: string; to: string };
  months?: ClimateMonth[];
  source?: { name: string; url: string };
}

export function useClimateMonths(city: string, countryCode: string | null, start: string | null, end: string | null, lang: "fr" | "en") {
  return useQuery({
    queryKey: ["climate-months", city, countryCode, start, end, lang],
    enabled: city.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await invokeProtectedFunction<ClimateResult>("climate-months", { body: { city, countryCode, start, end, locale: lang } });
      if (error) throw error;
      return data as ClimateResult;
    },
  });
}

/** Short factual summary sent to the AI (e.g. "janvier 14–21 °C, 3 jours de pluie"). Empty when unknown. */
export function climateSummary(r: ClimateResult | undefined, lang: "fr" | "en"): string {
  if (!r || r.status !== "ok" || !r.months?.length) return "";
  const locale = lang === "fr" ? "fr-FR" : "en-GB";
  return r.months
    .map((m) => `${new Date(2000, m.month - 1, 1).toLocaleDateString(locale, { month: "long" })} ${m.tmin ?? "?"}–${m.tmax ?? "?"} °C, ${m.rainyDays} ${lang === "fr" ? "j. de pluie" : "rainy days"}`)
    .join("; ");
}
