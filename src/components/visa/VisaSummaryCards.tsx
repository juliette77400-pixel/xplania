// The four summary cards of the Visa guide (Visa, Passport, Health, Safety).
// Each card: status, one short sentence, reliability, source and date, and a
// "details" toggle. Health, safety and entry rules for French nationals come
// from the official pages really read; visa and passport answers from the AI.
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ExternalLink, FileText, Globe, HeartPulse, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import ReliabilityBadge, { type Reliability } from "@/components/visa/ReliabilityBadge";
import { sourceOf, type OfficialResult, type OfficialSource, type SafetyCategory } from "@/hooks/useOfficialInfo";
import { healthRelevance, type VisaAnalysis } from "@/lib/visa-rules";
import { formatDay, formatDayTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { entrySourceFor } from "@/data/entry-sources";
import { formatDay as fmtDayOnly } from "@/lib/format-date";

type Tone = "good" | "warn" | "bad" | "neutral";
const TONE: Record<Tone, string> = {
  good: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning",
  bad: "bg-destructive/15 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

const FD_HOME = "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/";
const PASTEUR_HOME = "https://www.pasteur.fr/fr/votre-sante/voyages-et-sante/recommandations-sanitaires-par-pays";
const ARIANE = "https://pastel.diplomatie.gouv.fr/fildariane/dyn/public/login.html";
const EU_URL = { fr: "https://europa.eu/youreurope/citizens/travel/entry-exit/eu-citizen/index_fr.htm", en: "https://europa.eu/youreurope/citizens/travel/entry-exit/eu-citizen/index_en.htm" };

interface CardProps {
  id: string;
  icon: ReactNode;
  title: string;
  status: string;
  tone: Tone;
  summary: string;
  reliability: Reliability | null;
  source?: ReactNode;
  children?: ReactNode;
}

const SummaryCard = ({ id, icon, title, status, tone, summary, reliability, source, children }: CardProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <article aria-labelledby={`${id}-title`} className="flex flex-col rounded-2xl border border-border/70 bg-card/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>{icon}</span>
          <h3 id={`${id}-title`} className="text-base font-bold">{title}</h3>
        </div>
        {reliability && <ReliabilityBadge level={reliability} />}
      </div>
      <p className={cn("mt-3 w-fit rounded-full px-2.5 py-1 text-xs font-bold", TONE[tone])}>{status}</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{summary}</p>
      {source && <div className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{source}</div>}
      {children && (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-details`}
            onClick={() => setOpen((o) => !o)}
            className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {open ? t("visa2.cards.hideDetails") : t("visa2.cards.showDetails")}
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open && <div id={`${id}-details`} className="mt-3 space-y-3 border-t border-border/50 pt-3 text-sm">{children}</div>}
        </>
      )}
    </article>
  );
};

const SourceLine = ({ source, fetchedAt }: { source: OfficialSource; fetchedAt: string }) => {
  const { t, i18n } = useTranslation();
  return (
    <p>
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-foreground/80 hover:underline">
        {source.label}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">{t("visa2.opensNewTab")}</span>
      </a>
      {" · "}
      {source.updatedAt ? t("visa2.cards.updatedOn", { date: formatDay(source.updatedAt, i18n.language) }) : t("visa2.cards.noPageDate")}
      {" · "}
      {t("visa2.cards.checkedOn", { date: formatDayTime(fetchedAt, i18n.language) })}
    </p>
  );
};

const Unavailable = ({ href, label }: { href: string; label: string }) => {
  const { t } = useTranslation();
  return (
    <p>
      {t("visa2.cards.liveUnavailable")}{" "}
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
        {label}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">{t("visa2.opensNewTab")}</span>
      </a>
    </p>
  );
};

const List = ({ items }: { items: string[] }) =>
  items.length ? <ul className="list-disc space-y-1 pl-5 text-foreground/90">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : null;

const SAFETY_TONE: Record<SafetyCategory, Tone> = {
  normal: "good", reinforced: "warn", avoid_unless_essential: "bad", formally_advised_against: "bad", not_stated: "neutral",
};

interface Props {
  analysis: VisaAnalysis | null;
  official: OfficialResult | null;
  officialLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  days: number;
  isFrenchNational: boolean;
  destinationCode: string;
}

const VisaSummaryCards = ({ analysis, official, officialLoading, refreshing, onRefresh, days, isFrenchNational, destinationCode }: Props) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("fr") ? "fr" : "en";
  const content = official?.content ?? null;
  const fetchedAt = official?.fetchedAt || "";
  const entrySrc = sourceOf(official, "entry");
  const healthSrc = sourceOf(official, "health");
  const securitySrc = sourceOf(official, "security");
  const officialEntry = isFrenchNational && entrySrc && content ? content.entry : null;

  // ── Visa ──
  // The AI never sets the rule on its own: outside the EU rule, a non-French
  // student always gets "to confirm" with the destination's official site.
  const v = analysis?.visa;
  const entrySite = entrySourceFor(destinationCode);
  const aiOnly = !!v && !analysis?.rule && !isFrenchNational;
  const visaRel: Reliability | null = !v ? null : analysis?.rule ? "verified" : aiOnly || v.status === "depends" || v.status === "to_verify" ? "to_verify" : "indicative";
  const visaTone: Tone = !v ? "neutral" : aiOnly ? "warn" : v.status === "not_required" ? "good" : "warn";
  const reviewed = official?.reviewedAt ? t("visa2.cards.reviewedOn", { date: fmtDayOnly(official.reviewedAt, i18n.language) }) : "";

  // ── Health ──
  const health = healthSrc && content ? content.health : null;
  const conditional = (health?.conditional || []).map((c) => ({ ...c, relevance: healthRelevance(c.condition, days) }));
  const forStay = [...(health?.stay || []).map((s) => ({ item: s.item, detail: s.detail })), ...conditional.filter((c) => c.relevance === "applies").map((c) => ({ item: c.item, detail: c.condition }))];
  const maybe = conditional.filter((c) => c.relevance === "check");

  // ── Safety ──
  const safety = securitySrc && content ? content.safety : null;

  const loadingText = officialLoading ? t("visa2.cards.readingSources") : "";

  return (
    <section aria-labelledby="visa-cards-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="visa-cards-title" className="text-xl font-bold">{t("visa2.cards.title")}</h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {officialLoading
              ? t("visa2.cards.readingSources")
              : official && official.status !== "unavailable"
                ? t("visa2.cards.sourcesCheckedAt", { date: formatDayTime(fetchedAt, i18n.language) }) + (reviewed ? ` · ${reviewed}` : "")
                : t("visa2.cards.sourcesUnavailable")}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing || officialLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden />
          {refreshing ? t("visa2.cards.refreshing") : t("visa2.cards.refresh")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          id="card-visa"
          icon={<Globe className="h-4 w-4" />}
          title={t("visa2.cards.visa")}
          status={v ? (aiOnly ? t("visa2.cards.confirmOfficial") : v.title || t(`visa2.visaStatus.${v.status}`)) : t("visa2.cards.toAnalyze")}
          tone={visaTone}
          summary={v ? (aiOnly ? t("visa2.cards.aiLead", { answer: v.title || t(`visa2.visaStatus.${v.status}`) }) + " " + v.summary : v.summary) : t("visa2.cards.visaPending")}
          reliability={visaRel}
          source={v && (analysis?.rule
            ? <a href={EU_URL[lang]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-foreground/80 hover:underline">{t("visa2.cards.euSource")}<ExternalLink className="h-3 w-3" aria-hidden /></a>
            : <div className="space-y-1">
                {entrySite && (
                  <p><a href={entrySite.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{t("visa2.cards.checkOn", { site: entrySite.label })}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">{t("visa2.opensNewTab")}</span></a></p>
                )}
                <p>{t("visa2.cards.aiGenerated", { date: formatDayTime(analysis!.generatedAt, i18n.language) })}{!entrySite && v.official_url && <>{" · "}<a href={v.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-foreground/80 hover:underline">{t("visa2.cards.officialSite")}<ExternalLink className="h-3 w-3" aria-hidden /></a></>}</p>
              </div>)}
        >
          {(v || officialEntry) && (
            <>
              {v?.why && <p className="text-muted-foreground">{v.why}</p>}
              {v && (v.max_stay || v.cost || v.processing_time) && (
                <dl className="grid gap-1 text-xs">
                  {v.max_stay && <div><dt className="inline font-semibold">{t("visa2.cards.maxStay")} : </dt><dd className="inline">{v.max_stay}</dd></div>}
                  {v.cost && <div><dt className="inline font-semibold">{t("visa2.cards.cost")} : </dt><dd className="inline">{v.cost}</dd></div>}
                  {v.processing_time && <div><dt className="inline font-semibold">{t("visa2.cards.delay")} : </dt><dd className="inline">{v.processing_time}</dd></div>}
                </dl>
              )}
              {v && <List items={v.steps} />}
              {analysis && analysis.transit.needed !== "none" && analysis.transit.summary && (
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="mb-1 flex items-center justify-between gap-2 text-xs font-bold">{t("visa2.cards.transit")}<ReliabilityBadge level={analysis.transit.needed === "to_verify" ? "to_verify" : "indicative"} /></p>
                  <p className="text-foreground/90">{analysis.transit.summary}</p>
                </div>
              )}
              {officialEntry && (officialEntry.short_stay || officialEntry.long_stay) && (
                <div className="rounded-xl border border-success/25 bg-success/5 p-3">
                  <p className="mb-1 flex items-center justify-between gap-2 text-xs font-bold">{t("visa2.cards.officialForFrench")}<ReliabilityBadge level="verified" /></p>
                  <List items={[officialEntry.short_stay, officialEntry.long_stay].filter(Boolean)} />
                  <div className="mt-2 text-[11px] text-muted-foreground"><SourceLine source={entrySrc!} fetchedAt={fetchedAt} /></div>
                </div>
              )}
            </>
          )}
        </SummaryCard>

        <SummaryCard
          id="card-passport"
          icon={<FileText className="h-4 w-4" />}
          title={t("visa2.cards.passport")}
          status={!analysis ? t("visa2.cards.toAnalyze") : analysis.passport.id_card_accepted === "yes" ? t("visa2.cards.idCardOk") : t("visa2.cards.passportNeeded")}
          tone={!analysis ? "neutral" : analysis.passport.id_card_accepted === "yes" ? "good" : "warn"}
          summary={officialEntry?.documents[0] || analysis?.passport.summary || t("visa2.cards.passportPending")}
          reliability={officialEntry?.documents.length || analysis?.rule ? "verified" : analysis ? "indicative" : null}
          source={officialEntry?.documents.length ? <SourceLine source={entrySrc!} fetchedAt={fetchedAt} /> : analysis?.rule ? <a href={EU_URL[lang]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-foreground/80 hover:underline">{t("visa2.cards.euSource")}<ExternalLink className="h-3 w-3" aria-hidden /></a> : analysis ? <p>{t("visa2.cards.aiGenerated", { date: formatDayTime(analysis.generatedAt, i18n.language) })}</p> : null}
        >
          {(analysis || officialEntry) && (
            <>
              {officialEntry && <List items={[...officialEntry.documents.slice(1), ...officialEntry.other]} />}
              {analysis && (
                <div className={cn(officialEntry && "rounded-xl bg-muted/30 p-3")}>
                  {officialEntry && <p className="mb-1 flex items-center justify-between gap-2 text-xs font-bold">{t("visa2.cards.forYourProfile")}<ReliabilityBadge level="indicative" /></p>}
                  {officialEntry && <p className="text-foreground/90">{analysis.passport.summary}</p>}
                  <List items={analysis.passport.rules} />
                </div>
              )}
            </>
          )}
        </SummaryCard>

        <SummaryCard
          id="card-health"
          icon={<HeartPulse className="h-4 w-4" />}
          title={t("visa2.cards.health")}
          status={officialLoading ? t("visa2.cards.reading") : !health ? t("visa2.cards.unavailableShort") : health.entry_requirements.length ? t("visa2.cards.entryRequirement") : t("visa2.cards.noEntryRequirement")}
          tone={!health ? "neutral" : health.entry_requirements.length ? "warn" : "good"}
          summary={officialLoading ? loadingText : health ? t("visa2.cards.healthSummary", { count: forStay.length }) : ""}
          reliability={officialLoading ? null : health ? "verified" : "unavailable"}
          source={health ? <SourceLine source={healthSrc!} fetchedAt={fetchedAt} /> : !officialLoading ? <Unavailable href={PASTEUR_HOME} label={t("visa2.cards.pasteurLink")} /> : null}
        >
          {health && (
            <>
              <HealthGroup title={t("visa2.health.entry")} items={health.entry_requirements.map((x) => ({ item: x.item, detail: x.detail }))} empty={t("visa2.health.entryNone")} />
              <HealthGroup title={t("visa2.health.routine")} items={health.routine} />
              <HealthGroup title={t("visa2.health.forStay")} items={forStay} />
              <HealthGroup title={t("visa2.health.maybe")} items={maybe.map((x) => ({ item: x.item, detail: x.condition }))} />
              {health.malaria && <p className="text-xs text-muted-foreground"><span className="font-semibold">{t("visa2.health.malaria")} : </span>{health.malaria}</p>}
              <p className="text-xs text-muted-foreground">{t("visa2.health.doctor")}</p>
            </>
          )}
        </SummaryCard>

        <SummaryCard
          id="card-safety"
          icon={<ShieldAlert className="h-4 w-4" />}
          title={t("visa2.cards.safety")}
          status={officialLoading ? t("visa2.cards.reading") : !safety ? t("visa2.cards.unavailableShort") : safety.published_label || t(`visa2.safety.${safety.category}`)}
          tone={safety ? SAFETY_TONE[safety.category] : "neutral"}
          summary={officialLoading ? loadingText : safety ? safety.summary : ""}
          reliability={officialLoading ? null : safety ? "verified" : "unavailable"}
          source={safety ? <SourceLine source={securitySrc!} fetchedAt={fetchedAt} /> : !officialLoading ? <Unavailable href={FD_HOME} label={t("visa2.cards.fdLink")} /> : null}
        >
          {safety && (
            <>
              {safety.category === "not_stated" && <p className="text-muted-foreground">{t("visa2.safety.notStatedHelp")}</p>}
              {safety.zones.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-bold">{t("visa2.safety.zones")}</p>
                  <ul className="space-y-1">
                    {safety.zones.map((z, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", TONE[SAFETY_TONE[z.category]])}>{t(`visa2.safety.${z.category}`)}</span>
                        <span className="text-foreground/90">{z.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <List items={safety.key_points} />
              <a href={ARIANE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                {t("visa2.safety.ariane")}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">{t("visa2.opensNewTab")}</span>
              </a>
            </>
          )}
        </SummaryCard>
      </div>
      {refreshing && <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite"><Loader2 className="h-3 w-3 animate-spin" />{t("visa2.cards.readingSources")}</p>}
    </section>
  );
};

const HealthGroup = ({ title, items, empty }: { title: string; items: Array<{ item: string; detail: string }>; empty?: string }) => {
  if (!items.length && !empty) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-bold">{title}</p>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((x, i) => (
            <li key={i} className="rounded-lg bg-muted/30 px-3 py-2">
              <p className="font-semibold text-foreground">{x.item}</p>
              {x.detail && <p className="text-xs text-muted-foreground">{x.detail}</p>}
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-muted-foreground">{empty}</p>}
    </div>
  );
};

export default VisaSummaryCards;
