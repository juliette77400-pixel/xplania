import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, Loader2, Compass, ArrowLeft } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import HowItWorks from "@/components/shared/HowItWorks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { countryList, getCountryName } from "@/lib/countries";
import { CULTURE_PILLARS, FEATURED_COUNTRIES, getPrewritten, hasPrewritten, type PillarContent, type PillarId } from "@/data/culture-guide";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const ALIASES: Record<string, string> = {
  angleterre: "GB", "royaume-uni": "GB", england: "GB", uk: "GB", "united kingdom": "GB", ecosse: "GB",
  usa: "US", "etats-unis": "US", amerique: "US", "united states": "US", japan: "JP", china: "CN", brazil: "BR",
  mexico: "MX", spain: "ES", poland: "PL", netherlands: "NL", hollande: "NL", holland: "NL", australia: "AU", germany: "DE",
};
function findCountry(q: string): string | null {
  const n = norm(q);
  if (!n) return null;
  if (ALIASES[n]) return ALIASES[n];
  const exact = countryList.find((c) => norm(c.name) === n);
  if (exact) return exact.code;
  const starts = countryList.filter((c) => norm(c.name).startsWith(n));
  return starts.length === 1 ? starts[0].code : null;
}
const PROGRESS_KEY = "xplania-culture-progress";
const loadProgress = (): Record<string, boolean> => { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; } };
const SEV: Record<string, string> = { low: "🟢", medium: "🟠", high: "🔴" };

export default function GuideCulture() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "fr";
  const [query, setQuery] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pillar, setPillar] = useState<PillarId | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>(loadProgress);

  const suggestions = useMemo(() => {
    const n = norm(query);
    if (n.length < 2) return [];
    return countryList.filter((c) => norm(c.name).includes(n)).slice(0, 6);
  }, [query]);

  const choose = (c: string) => { setCode(c); setPillar(null); setNotFound(false); setQuery(""); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = findCountry(query);
    if (c) choose(c); else { setNotFound(true); setCode(null); }
  };
  const toggle = (k: string) => setDone((d) => { const n = { ...d, [k]: !d[k] }; localStorage.setItem(PROGRESS_KEY, JSON.stringify(n)); return n; });

  const countryName = code ? getCountryName(code) : "";
  const featured = code ? FEATURED_COUNTRIES.includes(code) : false;
  const doneCount = code ? CULTURE_PILLARS.filter((p) => done[`${code}:${p.id}`]).length : 0;

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="container mx-auto max-w-4xl px-4 pt-24 pb-16 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t("culture.title")}</h1>
          <p className="text-muted-foreground">{t("culture.subtitle")}</p>
        </header>

        <HowItWorks prefix="culture" />

        <form onSubmit={submit} className="glass-card rounded-2xl p-4 space-y-3">
          <label htmlFor="culture-country" className="text-sm font-semibold text-foreground">{t("culture.searchLabel")}</label>
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
                  {getCountryName(c)}
                </button>
              ))}
            </div>
          </div>
        </form>

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
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden" aria-label={t("culture.progress", { done: doneCount, total: CULTURE_PILLARS.length })}>
                <div className="h-full bg-primary transition-all" style={{ width: `${(doneCount / CULTURE_PILLARS.length) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("culture.progress", { done: doneCount, total: CULTURE_PILLARS.length })}</p>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {CULTURE_PILLARS.map((p) => (
                <button key={p.id} onClick={() => setPillar(p.id)} className="glass-card rounded-2xl p-4 text-left hover:border-primary/50 border border-transparent transition">
                  <span className="text-2xl" aria-hidden>{p.emoji}</span>
                  <p className="mt-2 text-sm font-semibold text-foreground">{t(`culture.pillars.${p.id}`)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {done[`${code}:${p.id}`] ? `✓ ${t("culture.understood")}` : hasPrewritten(code, p.id) ? t("culture.readySheet") : t("culture.aiSheet")}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {code && pillar && (
          <PillarView code={code} countryName={countryName} pillar={pillar} lang={lang}
            done={!!done[`${code}:${pillar}`]} onToggle={() => toggle(`${code}:${pillar}`)} onBack={() => setPillar(null)} />
        )}

        <p className="text-xs text-center text-muted-foreground">
          {t("culture.otherTools")} <Link to="/guide-visa" className="text-primary underline">{t("appNav.visa")}</Link> · <Link to="/suivi" className="text-primary underline">{t("appNav.tracking")}</Link>
        </p>
      </main>
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

  const q = useQuery({
    queryKey: ["culture-guide", code, pillar, lang],
    enabled: !pre && !!user,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const { data: cached } = await supabase.from("culture_guide_cache").select("content")
        .eq("country_code", code).eq("pillar", pillar).eq("locale", lang).maybeSingle();
      if (cached) return cached.content as unknown as PillarContent;
      const { data, error } = await supabase.functions.invoke("culture-guide", { body: { countryCode: code, countryName, pillar, locale: lang } });
      if (error || !data?.content) throw error ?? new Error("no content");
      return data.content as PillarContent;
    },
  });
  const content = pre ?? q.data;

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
      {q.isLoading && (
        <div className="glass-card rounded-2xl p-6 flex items-center justify-center gap-2 text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t("culture.loading")}
        </div>
      )}
      {q.isError && (
        <div role="status" className="glass-card rounded-2xl p-5 text-center space-y-2">
          <Compass className="mx-auto h-8 w-8 text-primary" aria-hidden />
          <p className="font-semibold text-foreground">{t("culture.notFoundTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("culture.pillarPending")}</p>
        </div>
      )}

      {content && (
        <>
          <div className="glass-card rounded-2xl p-4 flex gap-3 items-start">
            <span className="text-2xl" aria-hidden>🐧</span>
            <p className="text-sm text-foreground">{content.ping}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-foreground">✅ {t("culture.dos")}</h3>
              {content.dos.map((d, i) => (
                <div key={i}><p className="text-sm text-foreground">{d.text}</p><p className="text-xs text-muted-foreground">{t("culture.why")} {d.why}</p></div>
              ))}
            </div>
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-foreground">⛔ {t("culture.donts")}</h3>
              {content.donts.map((d, i) => (
                <div key={i}><p className="text-sm text-foreground">{d.severity ? `${SEV[d.severity]} ` : ""}{d.text}</p><p className="text-xs text-muted-foreground">{t("culture.why")} {d.why}</p></div>
              ))}
              <p className="text-[11px] text-muted-foreground">{t("culture.severityLegend")}</p>
            </div>
          </div>
          {content.homeVsHere.length > 0 && (
            <div className="glass-card rounded-2xl p-4 space-y-2">
              <h3 className="font-semibold text-foreground">🏠 {t("culture.homeVsHere")}</h3>
              {content.homeVsHere.map((h, i) => <p key={i} className="text-sm text-foreground">{h}</p>)}
            </div>
          )}
          {sensitive && <p className="text-xs text-muted-foreground italic">{t("culture.evolving")}</p>}
          {!pre && <p className="text-[11px] text-muted-foreground">{t("culture.aiNote")}</p>}
          <Button variant={done ? "secondary" : "default"} onClick={onToggle}>
            <Check className="h-4 w-4 mr-1" aria-hidden /> {done ? t("culture.understood") : t("culture.markUnderstood")}
          </Button>
        </>
      )}
    </section>
  );
}
