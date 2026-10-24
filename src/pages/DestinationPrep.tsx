// Public guide per destination ("Préparer son Erasmus ou son stage en Espagne").
// Content comes only from hand-written data (culture sheets, checked links):
// no AI, no invented figures. Each page leads to the preparation questionnaire.
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BedDouble, ExternalLink, FileCheck, Globe2, HeartPulse, MapPin, Wallet } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import Footer from "@/components/xplania/Footer";
import { useAuth } from "@/hooks/useAuth";
import { PREPARATION_HOME } from "@/config/featureFlags";
import { getPrewritten, getSituation, CULTURE_PILLARS } from "@/data/culture-guide";
import { entrySourceFor } from "@/data/entry-sources";
import { resourcesForCountry } from "@/data/housing-resources";
import { FREE_MOVEMENT } from "@/lib/visa-rules";
import { formatDay } from "@/lib/format-date";
import {
  DESTINATION_PAGES, DESTINATIONS_HUB, LINKS_CHECKED_ON, destinationPath, findDestination,
  franceDiplomatieEntryUrl, pasteurUrl, type DestinationPage,
} from "@/data/destination-pages";

const SIGNUP = "/auth?mode=signup&next=/preparation";

const ExtLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const { t } = useTranslation();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
      {children}<ExternalLink className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">{t("destPages.newTab")}</span>
    </a>
  );
};

const Block = ({ icon: Icon, title, children }: { icon: typeof Wallet; title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border/70 bg-card/60 p-6">
    <h2 className="flex items-center gap-2 text-xl font-bold"><Icon className="h-5 w-5 text-primary" aria-hidden />{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
  </section>
);

export const DestinationsHub = () => {
  const { t, i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-5xl px-4 py-14">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{t("destPages.kicker")}</p>
        <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">{t("destPages.hubTitle")}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t("destPages.hubIntro")}</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATION_PAGES.map((d) => (
            <li key={d.code}>
              <Link to={destinationPath(d)} className="interactive-card flex h-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-5">
                <span className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" aria-hidden />{t("destPages.cardTitle", { place: en ? d.inEn : d.inFr })}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};

const DestinationPrep = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const d = findDestination(slug);
  if (!d) return <Navigate to={DESTINATIONS_HUB} replace />;
  const en = i18n.language.startsWith("en");
  const lang: "fr" | "en" = en ? "en" : "fr";
  const place = en ? d.inEn : d.inFr;
  const name = en ? d.nameEn : d.nameFr;
  const cta = user ? PREPARATION_HOME : SIGNUP;
  const eu = FREE_MOVEMENT.has(d.code);
  const entry = entrySourceFor(d.code);
  const housing = resourcesForCountry(d.code);
  const housingLinks = [...housing.local, ...housing.european].slice(0, 5);
  const pillars = CULTURE_PILLARS.map((p) => p.id).map((id) => ({ id, c: getPrewritten(d.code, id, lang) })).filter((x) => !!x.c);
  const situation = getSituation(d.code, lang);
  const others: DestinationPage[] = DESTINATION_PAGES.filter((o) => o.code !== d.code);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-4xl px-4 py-14">
        <nav aria-label={t("destPages.breadcrumb")} className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Xplania</Link> <span aria-hidden>/</span>{" "}
          <Link to={DESTINATIONS_HUB} className="hover:text-foreground">{t("destPages.hubShort")}</Link> <span aria-hidden>/</span> <span>{name}</span>
        </nav>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-primary">{t("destPages.kicker")}</p>
        <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">{t("destPages.h1", { place })}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{t("destPages.intro", { place })}</p>
        <Link to={cta} className="gradient-button mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-primary-foreground">
          {t("destPages.cta")}<ArrowRight className="h-4 w-4" aria-hidden />
        </Link>

        <div className="mt-10 grid gap-5">
          <Block icon={FileCheck} title={t("destPages.visaTitle")}>
            <p>{eu ? t("destPages.visaEu", { place }) : t("destPages.visaOther", { place })}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><ExtLink href={franceDiplomatieEntryUrl(d)}>{t("destPages.franceDiplomatie")}</ExtLink> — {t("destPages.forFrench")}</li>
              {entry && <li><ExtLink href={entry.url}>{entry.label}</ExtLink> — {t("destPages.forOthers")}</li>}
            </ul>
            <p>{t("destPages.visaTool")}</p>
          </Block>

          <Block icon={HeartPulse} title={t("destPages.healthTitle")}>
            <p>{t("destPages.healthText")}</p>
            <p><ExtLink href={pasteurUrl(d)}>{t("destPages.pasteur", { country: name })}</ExtLink></p>
          </Block>

          <Block icon={Wallet} title={t("destPages.budgetTitle")}>
            <p>{t("destPages.budgetText")}</p>
            <ul className="list-disc space-y-1 pl-5">
              {(t("destPages.budgetItems", { returnObjects: true }) as string[]).map((x) => <li key={x}>{x}</li>)}
            </ul>
          </Block>

          <Block icon={BedDouble} title={t("destPages.housingTitle")}>
            <p>{t("destPages.housingText")}</p>
            {housingLinks.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {housingLinks.map((r) => <li key={r.id}><ExtLink href={r.url}>{r.name}</ExtLink></li>)}
              </ul>
            )}
            <p className="font-medium text-foreground">{t("destPages.scam")}</p>
          </Block>

          <Block icon={Globe2} title={t("destPages.cultureTitle", { place })}>
            {pillars.map(({ id, c }) => (
              <div key={id}>
                <h3 className="font-semibold text-foreground">{t(`culture.pillars.${id}`)}</h3>
                <p>{c!.ping}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {c!.dos.slice(0, 2).map((x) => <li key={x.text}>✅ {x.text} — {x.why}</li>)}
                  {c!.donts.slice(0, 1).map((x) => <li key={x.text}>⚠️ {x.text} — {x.why}</li>)}
                </ul>
              </div>
            ))}
            {situation && (
              <div className="rounded-xl bg-primary/10 p-4 text-foreground">
                <p className="font-semibold">{t("destPages.situation")}</p>
                <p className="mt-1">{situation.q}</p>
                <p className="mt-1 text-muted-foreground">→ {situation.options[situation.correct]}. {situation.ping}</p>
              </div>
            )}
            <p className="text-xs">{t("destPages.cultureNote")}</p>
          </Block>
        </div>

        <section className="mt-10 rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center">
          <h2 className="text-2xl font-bold">{t("destPages.finalTitle", { place })}</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{t("destPages.finalText")}</p>
          <Link to={cta} className="gradient-button mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-primary-foreground">
            {t("destPages.cta")}<ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">{t("destPages.free")}</p>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">{t("destPages.checkedOn", { date: formatDay(LINKS_CHECKED_ON, i18n.language) })}</p>

        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("destPages.others")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.code}><Link to={destinationPath(o)} className="inline-block rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">{en ? o.nameEn : o.nameFr}</Link></li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DestinationPrep;
