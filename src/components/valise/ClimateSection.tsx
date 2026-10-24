// Usual weather in the student's city during the months of the stay (observed
// one year earlier, same dates) and the clothes it implies.
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CloudRain, Loader2, Plus, Thermometer } from "lucide-react";
import { invokeProtectedFunction } from "@/lib/protected-functions";
import { Button } from "@/components/ui/button";
import { climateHints, type ClimateMonth } from "@/lib/valise-profiles";

interface ClimateResult {
  status: "ok" | "not_found" | "unavailable";
  planned?: boolean;
  place?: { name: string; region: string; country: string };
  observed?: { from: string; to: string };
  months?: ClimateMonth[];
  source?: { name: string; url: string };
}

interface Props {
  city: string;
  countryCode: string | null;
  start: string | null;
  end: string | null;
  onAdd: (items: string[]) => void;
}

const ClimateSection = ({ city, countryCode, start, end, onAdd }: Props) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("fr") ? "fr" : "en";
  const locale = lang === "fr" ? "fr-FR" : "en-GB";
  const q = useQuery({
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
  const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleDateString(locale, { month: "long" });
  const fmtDay = (d: string) => new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const r = q.data;
  const hints = r?.status === "ok" && r.months ? climateHints(r.months) : [];

  return (
    <section aria-labelledby="climate-title" className="glass-card rounded-2xl p-6">
      <div className="mb-3 flex items-center gap-3">
        <Thermometer className="h-5 w-5 text-primary" aria-hidden />
        <div>
          <h3 id="climate-title" className="text-base font-bold">{t("valise2.climate.title", { city: r?.place?.name || city })}</h3>
          <p className="text-xs text-muted-foreground">{r?.planned === false ? t("valise2.climate.noDates") : t("valise2.climate.subtitle")}</p>
        </div>
      </div>

      {q.isLoading && <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("valise2.climate.loading")}</p>}
      {(q.isError || r?.status === "unavailable") && <p className="text-sm text-muted-foreground">{t("valise2.climate.unavailable")}</p>}
      {r?.status === "not_found" && <p className="text-sm text-muted-foreground">{t("valise2.climate.notFound", { city })}</p>}

      {r?.status === "ok" && r.months && (
        <>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {r.months.map((m) => (
              <li key={m.month} className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs font-semibold capitalize text-muted-foreground">{monthName(m.month)}</p>
                <p className="text-lg font-bold tabular-nums">{m.tmin ?? "—"}° / {m.tmax ?? "—"}°</p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><CloudRain className="h-3 w-3" aria-hidden />{t("valise2.climate.rainyDays", { count: m.rainyDays })}</p>
              </li>
            ))}
          </ul>
          {hints.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("valise2.climate.whatToPack")}</p>
              <ul className="space-y-1.5">
                {hints.map((h) => (
                  <li key={h} className="flex items-center justify-between gap-3 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                    <span>{t(`valise2.climate.hints.${h}.text`)}</span>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" onClick={() => onAdd(hints.flatMap((h) => t(`valise2.climate.hints.${h}.items`, { returnObjects: true }) as string[]))}>
                <Plus className="mr-1 h-3.5 w-3.5" />{t("valise2.climate.addAll")}
              </Button>
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            {t("valise2.climate.source", { from: fmtDay(r.observed!.from), to: fmtDay(r.observed!.to) })}{" "}
            <a href={r.source!.url} target="_blank" rel="noopener noreferrer" className="underline">{r.source!.name}</a>
            {r.place?.region ? ` · ${r.place.name}, ${r.place.region}` : ""}
          </p>
        </>
      )}
    </section>
  );
};

export default ClimateSection;
