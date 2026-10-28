import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Check, Loader2, Compass, ArrowLeft, Globe2, GraduationCap, Briefcase, Home as HomeIcon, CircleCheck, CircleX, Lightbulb, ChevronDown } from "lucide-react";
import CollapsibleSection from "@/components/shared/CollapsibleSection";
import QuickJump from "@/components/shared/QuickJump";
import { findCountry, normCountry } from "@/lib/country-match";
import { useTravelStore } from "@/stores/useTravelStore";
import { useHydrateActiveTrip } from "@/hooks/useHydrateActiveTrip";
import AppNavbar from "@/components/shared/AppNavbar";
import { track } from "@/lib/analytics";
import HowItWorks from "@/components/shared/HowItWorks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isAiPause } from "@/lib/ai-pause";
import { useAuth } from "@/hooks/useAuth";
import { countryList, getCountryNameIn } from "@/lib/countries";
import { CULTURE_PATHS, CULTURE_PATH_IDS, morePillars, pathForStay, type CulturePath, CULTURE_PILLARS, FEATURED_COUNTRIES, getPrewritten, hasPrewritten, getSituation, getTipOfDay, buildQuiz, type PillarContent, type PillarId } from "@/data/culture-guide";
import GuestSaveBanner from "@/components/shared/GuestSaveBanner";
import { localDateFor } from "@/lib/country-timezone";

const norm = normCountry;
const PROGRESS_KEY = "xplania-culture-progress";
const loadProgress = (): Record<string, boolean> => { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; } };
const SEV: Record<string, string> = { low: "🟢", medium: "🟠", high: "🔴" };
const PATH_ICON: Record<CulturePath, typeof GraduationCap> = { study: GraduationCap, internship: Briefcase, daily: HomeIcon };
const EMOJI: Record<string, string> = Object.fromEntries(CULTURE_PILLARS.map((p) => [p.id, p.emoji]));

export default function GuideCulture() {
  useHydrateActiveTrip();
  const tripDestination = useTravelStore((s) => s.tripData?.destination);
  const stayType = useTravelStore((s) => s.tripData?.stayType);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "fr";
  const [query, setQuery] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pillar, setPillar] = useState<PillarId | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>(loadProgress);
  const [touched, setTouched] = useState(false);
  // The country comes from the trip: the picker only shows when asked for (or when no country is known).
  const [picking, setPicking] = useState(false);
  const [path, setPath] = useState<CulturePath>(() => pathForStay(stayType));
  const [pathTouched, setPathTouched] = useState(false);
  useEffect(() => { if (!pathTouched) setPath(pathForStay(stayType)); }, [stayType, pathTouched]);

  // Open the guide on the trip's destination country until the traveler picks another one.
  useEffect(() => {
    if (touched) return;
    const c = findCountry(tripDestination);
    if (c) setCode(c);
  }, [tripDestination, touched]);

  const suggestions = useMemo(() => {
    const n = norm(query);
    if (n.length < 2) return [];
    return countryList.filter((c) => norm(c.name).includes(n)).slice(0, 6);
  }, [query]);

  const choose = (c: string) => { setTouched(true); setCode(c); setPillar(null); setNotFound(false); setQuery(""); setPicking(false); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = findCountry(query);
    if (c) choose(c); else { setTouched(true); setNotFound(true); setCode(null); }
  };
  const toggle = (k: string) => setDone((d) => {
    const n = { ...d, [k]: !d[k] };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(n));
    if (n[k]) track("guide_action", { module: "culture", pillar: k.split(":")[1] || k });
    return n;
  });

  const countryName = code ? getCountryNameIn(code, lang) : "";
  const featured = code ? FEATURED_COUNTRIES.includes(code) : false;
  const pathPillars = CULTURE_PATHS[path];
  const doneCount = code ? pathPillars.filter((p) => done[`${code}:${p}`]).length : 0;
  // Every theme already written for this country, in one request: opening one of them is instant.
  const { user } = useAuth();
  const cachedPillars = useQuery({
    queryKey: ["culture-cached", code, lang],
    enabled: !!code && !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("culture_guide_cache").select("pillar, content")
        .eq("country_code", code!).eq("locale", lang).in("pillar", CULTURE_PILLARS.map((p) => p.id));
      return Object.fromEntries((data ?? []).map((r) => [r.pillar, r.content as unknown as PillarContent])) as Record<string, PillarContent>;
    },
  });
  const pillarCard = (id: PillarId) => (
    <button key={id} onClick={() => setPillar(id)} className="glass-card rounded-2xl p-4 text-left hover:border-primary/50 border border-transparent transition">
      <span className="text-2xl" aria-hidden>{EMOJI[id]}</span>
      <p className="mt-2 text-sm font-semibold text-foreground">{t(`culture.pillars.${id}`)}</p>
      <p className="text-[11px] text-muted-foreground mt-1">
        {done[`${code}:${id}`] ? `✓ ${t("culture.understood")}` : hasPrewritten(code!, id) || cachedPillars.data?.[id] ? t("culture.readySheet") : t("culture.aiSheet")}
      </p>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="px-4"><GuestSaveBanner /></div>
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-4xl px-4 sm:px-6 py-6 pb-16 space-y-6">
        {/* Same layout as « Visa & Préparatifs »: hero, then the destination card. */}
        <header className="rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_90%_20%,hsl(var(--secondary)/.16),transparent_32%),linear-gradient(145deg,hsl(var(--card)),hsl(var(--background)))] p-6 sm:p-10">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Globe2 className="h-4 w-4" aria-hidden />{t("culture.heroKicker")}</p>
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{t("culture.title")}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t("culture.subtitle")}</p>
        </header>

        {code && !picking && !notFound ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/45 px-5 py-4">
            <p className="text-sm text-muted-foreground">{t("culture.yourCountry")} <span className="ml-1 text-base font-bold text-foreground">{getCountryNameIn(code, lang)}</span></p>
            <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>{t("culture.changeCountry")}</Button>
          </div>
        ) : (
        <form onSubmit={submit} className="rounded-2xl border border-border/70 bg-card/45 p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{t("culture.contextKicker")}</p>
          <label htmlFor="culture-country" className="block text-xl font-bold text-foreground">{t("culture.searchLabel")}</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="culture-country" value={query} onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
                placeholder={t("culture.searchPlaceholder")} className="pl-9" autoComplete="off" />
            </div>
            <Button type="submit">{t("culture.searchBtn")}</Button>
          </div>
          {suggestions.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s.code}><button type="button" onClick={() => choose(s.code)} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground hover:bg-primary/15">{s.name}</button></li>
              ))}
            </ul>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("culture.featured")}</p>
            <div className="flex flex-wrap gap-2">
              {FEATURED_COUNTRIES.map((c) => (
                <button key={c} type="button" onClick={() => choose(c)}
                  className={`rounded-full border px-3 py-1 text-xs ${code === c ? "border-primary bg-primary/20 text-foreground" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"}`}>
                  {getCountryNameIn(c, lang)}
                </button>
              ))}
            </div>
          </div>
        </form>
        )}

        {!code && <HowItWorks prefix="culture" />}

        {notFound && (
          <div role="status" className="glass-card rounded-2xl p-5 text-center space-y-2">
            <Compass className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <p className="font-semibold text-foreground">{t("culture.notFoundTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("culture.notFoundDesc")}</p>
          </div>
        )}

        {code && !pillar && (
          <section className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-xl font-bold text-foreground">{countryName}</h2>
              <p className="text-sm text-muted-foreground mt-1">{featured ? t("culture.welcomeFeatured") : t("culture.welcomeOther")}</p>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={pathPillars.length} aria-label={t("culture.progress", { done: doneCount, total: pathPillars.length })}>
                <div className="h-full bg-primary transition-all" style={{ width: `${(doneCount / pathPillars.length) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("culture2.pathProgress", { done: doneCount, total: pathPillars.length })}</p>
            </div>

            <div role="radiogroup" aria-label={t("culture2.pathsTitle")} className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("culture2.pathsTitle")}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {CULTURE_PATH_IDS.map((id) => {
                  const Icon = PATH_ICON[id];
                  const active = path === id;
                  return (
                    <button key={id} type="button" role="radio" aria-checked={active} onClick={() => { setPath(id); setPathTouched(true); }}
                      className={`rounded-2xl border-2 p-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/40"}`}>
                      <span className="flex items-center gap-2 text-sm font-bold text-foreground"><Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} aria-hidden />{t(`culture2.paths.${id}.title`)}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{t(`culture2.paths.${id}.desc`)}</span>
                      {id === pathForStay(stayType) && stayType && <span className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{t("culture2.forYourStay")}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <TipOfDay code={code} lang={lang} path={path} onOpen={setPillar} />

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{t("culture2.priorityTitle")}</h3>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">{pathPillars.map(pillarCard)}</div>
            </div>

            <CollapsibleSection title={t("culture2.moreTitle", { count: morePillars(path).length })} subtitle={t("culture2.moreSub")} sectionId="culture-more">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">{morePillars(path).map(pillarCard)}</div>
            </CollapsibleSection>

            <SituationCard code={code} lang={lang} />
          </section>
        )}

        {code && pillar && (
          <PillarView code={code} countryName={countryName} pillar={pillar} lang={lang}
            done={!!done[`${code}:${pillar}`]} onToggle={() => toggle(`${code}:${pillar}`)} onBack={() => setPillar(null)} />
        )}

        <p className="text-xs text-center text-muted-foreground">
          {t("culture.otherTools")} <Link to="/guide-visa" className="text-primary underline">{t("appNav.visa")}</Link> · <Link to="/guide-valise" className="text-primary underline">{t("appNav.suitcase")}</Link>
        </p>
      </main>
      <QuickJump />
    </div>
  );
}

function PillarView({ code, countryName, pillar, lang, done, onToggle, onBack }: {
  code: string; countryName: string; pillar: PillarId; lang: "fr" | "en"; done: boolean; onToggle: () => void; onBack: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const pre = getPrewritten(code, pillar, lang);
  const sensitive = CULTURE_PILLARS.find((p) => p.id === pillar && "sensitive" in p);

  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["culture-guide", code, pillar, lang],
    enabled: !pre && !!user,
    staleTime: Infinity,
    retry: false,
    // Already in the list of themes written for this country: shown at once, no request.
    initialData: () => qc.getQueryData<Record<string, PillarContent>>(["culture-cached", code, lang])?.[pillar],
    queryFn: async () => {
      const { data: cached } = await supabase.from("culture_guide_cache").select("content")
        .eq("country_code", code).eq("pillar", pillar).eq("locale", lang).maybeSingle();
      if (cached) return cached.content as unknown as PillarContent;
      const { data, error } = await supabase.functions.invoke("culture-guide", { body: { countryCode: code, countryName, pillar, locale: lang } });
      // Culture has its own monthly tries, separate from Valise.
      if ((error as { context?: { status?: number } } | null)?.context?.status === 402) throw new Error("quota_exceeded");
      if (error || !data?.content) throw error ?? new Error("no content");
      if (!data.cached) qc.invalidateQueries({ queryKey: ["quota"] });
      qc.invalidateQueries({ queryKey: ["culture-cached", code, lang] });
      return data.content as PillarContent;
    },
  });
  const quotaReached = q.error instanceof Error && q.error.message === "quota_exceeded";
  // Hand-written tips get a concrete example and a nuance, generated once and shared (no try used).
  const preTips = pre ? [...pre.dos, ...pre.donts].map((x) => x.text) : [];
  const enrich = useQuery({
    queryKey: ["culture-enrich", code, pillar, lang, preTips.join("|")],
    enabled: !!pre && !!user && preTips.length > 0,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      // Read the shared copy directly when it exists (same key as the server), before waking the function.
      const key = `enrich:${pillar}:${await sha8(preTips.join("\n"))}`;
      const { data: cached } = await supabase.from("culture_guide_cache").select("content")
        .eq("country_code", code).eq("pillar", key).eq("locale", lang).maybeSingle();
      if (cached) return (cached.content as unknown as { items: { example: string; nuance: string }[] }).items;
      const { data, error } = await supabase.functions.invoke("culture-guide", { body: { kind: "enrich", countryCode: code, pillar, locale: lang, tips: preTips } });
      if (error || !data?.content) throw error ?? new Error("no content");
      return (data.content as { items: { example: string; nuance: string }[] }).items;
    },
  });
  const content: PillarContent | undefined = pre
    ? (() => {
        const items = enrich.data ?? [];
        const add = (x: PillarContent["dos"][number], i: number) => (items[i]?.example ? { ...x, example: items[i].example, nuance: items[i].nuance } : x);
        return { ...pre, dos: pre.dos.map((x, i) => add(x, i)), donts: pre.donts.map((x, i) => add(x, i + pre.dos.length)) };
      })()
    : q.data;
  return (
    <section className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t("culture.back")}
      </button>
      <h2 className="text-xl font-bold text-foreground">{t(`culture.pillars.${pillar}`)} · {countryName}</h2>

      {!pre && !user && (
        <div className="glass-card rounded-2xl p-5 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{t("culture.loginNeeded")}</p>
          <Button asChild><Link to="/auth">{t("culture.login")}</Link></Button>
        </div>
      )}
      {q.isLoading && <PillarSkeleton />}
      {q.isError && quotaReached && (
        <div role="status" className="glass-card rounded-2xl p-5 text-center space-y-3">
          <Compass className="mx-auto h-8 w-8 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("culture.quotaReached")}</p>
          <Button asChild variant="outline"><Link to="/offres">{t("culture.quotaSeeOffers")}</Link></Button>
        </div>
      )}
      {q.isError && !quotaReached && (
        <div role="alert" className="glass-card rounded-2xl p-5 text-center space-y-2">
          <Compass className="mx-auto h-8 w-8 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">{isAiPause(q.error) ? t("aiPause.message") : t("culture.genFailed")}</p>
          <Button variant="outline" size="sm" className="mt-2" disabled={q.isFetching} onClick={() => q.refetch()}>
            {q.isFetching && <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />}{t("common.retry")}
          </Button>
        </div>
      )}
      {pre && enrich.isLoading && (
        <p role="status" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />{t("culture.enriching")}</p>
      )}

      {content && (
        <>
          <div className="glass-card rounded-2xl p-4 flex gap-3 items-start">
            <span className="text-2xl" aria-hidden>🐧</span>
            <p className="text-sm text-foreground">{content.ping}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <TipColumn kind="do" title={t("culture.dos")} tips={content.dos} />
            <TipColumn kind="dont" title={t("culture.donts")} tips={content.donts} legend={t("culture.severityLegend")} />
          </div>
          {content.homeVsHere.length > 0 && (
            <section aria-labelledby="good-to-know" className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              <h3 id="good-to-know" className="flex items-center gap-2 font-bold text-foreground"><Lightbulb className="h-5 w-5 text-primary" aria-hidden />{t("culture.goodToKnow")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("culture.homeVsHere")}</p>
              <ul className="mt-3 space-y-2">
                {content.homeVsHere.map((h, i) => <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />{h}</li>)}
              </ul>
            </section>
          )}
          {sensitive && <p className="text-xs text-muted-foreground italic">{t("culture.evolving")}</p>}
          {(!pre || !!enrich.data?.length) && <p className="text-[11px] text-muted-foreground">{t(pre ? "culture.enrichNote" : "culture.aiNote")}</p>}
          <MiniQuiz key={`${code}-${pillar}`} content={content} />
          <Button variant={done ? "secondary" : "default"} onClick={onToggle}>
            <Check className="h-4 w-4 mr-1" aria-hidden /> {done ? t("culture.understood") : t("culture.markUnderstood")}
          </Button>
        </>
      )}
    </section>
  );
}

type Tip = PillarContent["dos"][number] & { example?: string; nuance?: string };

const TIP_STYLE = {
  do: { icon: CircleCheck, box: "border-success/30 bg-success/5", ink: "text-success" },
  dont: { icon: CircleX, box: "border-destructive/30 bg-destructive/5", ink: "text-destructive" },
} as const;

/** "À faire" / "À éviter": one short card per tip, the explanation and example fold away. */
function TipColumn({ kind, title, tips, legend }: { kind: "do" | "dont"; title: string; tips: Tip[]; legend?: string }) {
  const { t } = useTranslation();
  const st = TIP_STYLE[kind];
  const Icon = st.icon;
  return (
    <section aria-label={title} className="space-y-3">
      <h3 className={`flex items-center gap-2 font-bold ${st.ink}`}><Icon className="h-5 w-5" aria-hidden />{title}</h3>
      <ul className="space-y-3">
        {tips.map((d, i) => (
          <li key={i} className={`rounded-2xl border p-4 ${st.box}`}>
            <p className="text-sm font-semibold leading-relaxed text-foreground">{kind === "dont" && d.severity ? <span className="mr-1" aria-label={t(`culture.severity.${d.severity}`)}>{SEV[d.severity]}</span> : null}{d.text}</p>
            <details className="group mt-2">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-primary [&::-webkit-details-marker]:hidden">
                {t("culture.whyAndExample")}<ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <dl className="mt-2 space-y-1.5 text-xs leading-relaxed">
                <div><dt className="inline font-semibold text-foreground">{t("culture.daily.context")} </dt><dd className="inline text-muted-foreground">{d.why}</dd></div>
                {d.example && <div><dt className="inline font-semibold text-foreground">{t("culture.daily.example")} </dt><dd className="inline text-muted-foreground">{d.example}</dd></div>}
                {d.nuance && <div><dt className="inline font-semibold text-foreground">{t("culture.daily.nuance")} </dt><dd className="inline text-muted-foreground">{d.nuance}</dd></div>}
              </dl>
            </details>
          </li>
        ))}
      </ul>
      {legend && <p className="text-[11px] text-muted-foreground">{legend}</p>}
    </section>
  );
}

interface DailyGesture { title: string; context: string; example: string; nuance: string; theme: PillarId; date: string }

/**
 * Gesture of the day: one per destination, entry path and local day (shared by every student, so
 * it costs one generation per day). Visitors and failures get a hand-written tip instead.
 */
function TipOfDay({ code, lang, path, onOpen }: { code: string; lang: "fr" | "en"; path: CulturePath; onOpen: (p: PillarId) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  // Re-checked every minute so the tip changes at the destination's midnight without a reload.
  const [date, setDate] = useState(() => localDateFor(code));
  useEffect(() => {
    setDate(localDateFor(code));
    const id = window.setInterval(() => setDate(localDateFor(code)), 60_000);
    return () => window.clearInterval(id);
  }, [code]);
  const q = useQuery({
    queryKey: ["culture-daily", code, path, date, lang],
    enabled: !!user,
    staleTime: Infinity,
    retry: false,
    queryFn: async (): Promise<DailyGesture> => {
      const key = `daily:${path}:${date}`;
      const { data: cached } = await supabase.from("culture_guide_cache").select("content")
        .eq("country_code", code).eq("pillar", key).eq("locale", lang).maybeSingle();
      if (cached) return cached.content as unknown as DailyGesture;
      const { data, error } = await supabase.functions.invoke("culture-guide", { body: { kind: "daily", countryCode: code, path, date, locale: lang } });
      if (error || !data?.content) throw error ?? new Error("no content");
      return data.content as DailyGesture;
    },
  });
  const fallback = getTipOfDay(code, lang, path, date);
  const card = "glass-card w-full rounded-2xl border border-primary/30 p-4 text-left";

  const loading = !!user && q.isLoading;
  // Nothing hand-written to show meanwhile: keep the placeholder lines.
  if (loading && !fallback) {
    return (
      <div className={card} role="status">
        <p className="text-xs font-semibold text-primary">✨ {t("culture.tipOfDay")}</p>
        <div className="mt-2 space-y-2"><div className="h-3 w-3/4 animate-pulse rounded bg-muted/60" /><div className="h-3 w-1/2 animate-pulse rounded bg-muted/60" /></div>
      </div>
    );
  }
  if (q.data) {
    const g = q.data;
    return (
      <div className={card}>
        <p className="text-xs font-semibold text-primary">✨ {t("culture.tipOfDay")} · {t(`culture.pillars.${g.theme}`)}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{g.title}</p>
        <dl className="mt-2 space-y-1.5 text-xs leading-relaxed">
          <div><dt className="inline font-semibold text-foreground">{t("culture.daily.context")} </dt><dd className="inline text-muted-foreground">{g.context}</dd></div>
          <div><dt className="inline font-semibold text-foreground">{t("culture.daily.example")} </dt><dd className="inline text-muted-foreground">{g.example}</dd></div>
          <div><dt className="inline font-semibold text-foreground">{t("culture.daily.nuance")} </dt><dd className="inline text-muted-foreground">{g.nuance}</dd></div>
        </dl>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">{t("culture.daily.note")}</p>
          <button type="button" onClick={() => onOpen(g.theme)} className="text-xs font-semibold text-primary hover:underline">{t("culture.daily.openTheme")}</button>
        </div>
      </div>
    );
  }
  if (!fallback) return null;
  // While today's gesture is written (first visitor of the day), a hand-written tip is shown at once.
  return (
    <button onClick={() => onOpen(fallback.pillar)} className={card} aria-busy={loading}>
      <p className="text-xs font-semibold text-primary">✨ {t("culture.tipOfDay")} · {t(`culture.pillars.${fallback.pillar}`)}</p>
      <p className="mt-1 text-sm text-foreground">{fallback.kind === "do" ? "✅" : "⛔"} {fallback.tip.text}</p>
      <p className="text-xs text-muted-foreground">{t("culture.why")} {fallback.tip.why}</p>
      {loading && <p role="status" className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" aria-hidden />{t("culture.dailyComing")}</p>}
    </button>
  );
}

/** Same shape as a theme (Ping, two columns of cards) while it is written for the first time. */
function PillarSkeleton() {
  const { t } = useTranslation();
  const bar = "animate-pulse rounded bg-muted/60";
  const col = (
    <div className="space-y-3">
      <div className={`h-4 w-24 ${bar}`} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border/50 p-4 space-y-2">
          <div className={`h-3 w-5/6 ${bar}`} /><div className={`h-3 w-2/3 ${bar}`} />
        </div>
      ))}
    </div>
  );
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="glass-card rounded-2xl p-4 flex gap-3 items-center">
        <span className="text-2xl" aria-hidden>🐧</span>
        <div className="flex-1 space-y-1">
          <p className="inline-flex items-center gap-1.5 text-sm text-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />{t("culture.loading")}</p>
          <p className="text-xs text-muted-foreground">{t("culture.loadingFirst")}</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">{col}{col}</div>
    </div>
  );
}

/** First 4 bytes of SHA-256, hex: the same key the server uses for shared examples. */
async function sha8(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 4).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function SituationCard({ code, lang }: { code: string; lang: "fr" | "en" }) {
  const { t } = useTranslation();
  const [pick, setPick] = useState<number | null>(null);
  const s = getSituation(code, lang);
  if (!s) return null;
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <p className="text-xs font-semibold text-primary">🎭 {t("culture.situation")}</p>
      <p className="text-sm font-semibold text-foreground">{s.q}</p>
      <div className="grid gap-2">
        {s.options.map((o, i) => (
          <button key={i} onClick={() => setPick(i)} disabled={pick !== null}
            className={`rounded-xl border px-3 py-2 text-left text-sm ${pick === null ? "border-border hover:border-primary/50" : i === s.correct ? "border-primary bg-primary/15" : i === pick ? "border-destructive bg-destructive/10" : "border-border opacity-60"} text-foreground`}>
            {String.fromCharCode(65 + i)}. {o}
          </button>
        ))}
      </div>
      {pick !== null && (
        <div className="flex gap-2 items-start">
          <span aria-hidden>🐧</span>
          <p className="text-sm text-foreground">{pick === s.correct ? "" : `${t("culture.notQuite")} `}{s.ping}</p>
        </div>
      )}
      {pick !== null && <p className="text-xs italic text-muted-foreground">{t("culture2.nuance")}</p>}
      {pick !== null && <Button variant="ghost" size="sm" onClick={() => setPick(null)}>{t("culture.retry")}</Button>}
    </div>
  );
}

function MiniQuiz({ content }: { content: PillarContent }) {
  const { t } = useTranslation();
  const quiz = useMemo(() => buildQuiz(content), [content]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  if (quiz.length === 0) return null;
  const answered = Object.keys(answers).length;
  const score = quiz.filter((q, i) => answers[i] === q.correct).length;
  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <h3 className="font-semibold text-foreground">🧠 {t("culture.quizTitle")}</h3>
      {quiz.map((q, i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{i + 1}. {t(q.q === "avoid" ? "culture.quizAvoid" : "culture.quizDo")}</p>
          <div className="grid gap-2">
            {q.options.map((o, j) => {
              const a = answers[i];
              const cls = a === undefined ? "border-border hover:border-primary/50" : j === q.correct ? "border-primary bg-primary/15" : j === a ? "border-destructive bg-destructive/10" : "border-border opacity-60";
              return (
                <button key={j} disabled={a !== undefined} onClick={() => setAnswers((x) => ({ ...x, [i]: j }))}
                  className={`rounded-xl border px-3 py-2 text-left text-sm text-foreground ${cls}`}>{o}</button>
              );
            })}
          </div>
        </div>
      ))}
      {answered === quiz.length && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-foreground">🐧 {t("culture.quizScore", { score, total: quiz.length })} {score === quiz.length ? t("culture.quizPerfect") : t("culture.quizKeep")}<span className="mt-1 block text-xs italic text-muted-foreground">{t("culture2.nuance")}</span></p>
          <Button variant="ghost" size="sm" onClick={() => setAnswers({})}>{t("culture.retry")}</Button>
        </div>
      )}
    </div>
  );
}
