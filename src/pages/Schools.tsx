import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Mail, ShieldCheck, School, Check, Quote, Plane, Compass, BookOpen, Users, Bot, GraduationCap, Sparkles } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import Footer from "@/components/xplania/Footer";
import pipMascot from "@/assets/pip-mascot.png.asset.json";
import Testimonials from "@/components/xplania/Testimonials";

type Block = { title: string; items: string[] };
type Card = { title: string; desc: string };

const phaseIcons = [Plane, Compass, BookOpen];
const teamIcons = [Users, Bot, GraduationCap, Sparkles];

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 text-center text-2xl font-bold text-foreground md:text-3xl">{children}</h2>
);

const Schools = () => {
  const { t } = useTranslation();
  const arr = <T,>(k: string) => ((t(k, { returnObjects: true }) as T[]) || []);
  const problems = arr<string>("schools.problems");
  const phases = arr<Block>("schools.phases");
  const benefits = arr<string>("schools.benefits");
  const team = arr<Card>("schools.team");
  const profiles = arr<Block>("schools.profiles");
  const steps = arr<string>("schools.pilotSteps");
  const win = arr<Block>("schools.win");
  const email = t("about.cta.email");
  const mailto = `mailto:${email}?subject=${encodeURIComponent(t("schools.mailSubject"))}`;

  const List = ({ items }: { items: string[] }) => (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{i}</li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-28">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "var(--gradient-primary)" }} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container relative mx-auto max-w-3xl px-6 text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              <School className="h-3 w-3" />{t("schools.badge")}
            </span>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl">{t("schools.title")}</h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{t("schools.subtitle")}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a href={mailto} className="gradient-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90">
                {t("schools.ctaPrimary")}<ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/home" className="inline-flex items-center justify-center rounded-full border border-border bg-background/50 px-6 py-3 font-semibold text-foreground transition hover:bg-muted/50">
                {t("schools.ctaSecondary")}
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="py-14">
          <div className="container mx-auto max-w-4xl px-6">
            <H2>{t("schools.problemTitle")}</H2>
            <p className="mb-8 text-center text-muted-foreground">{t("schools.problemSubtitle")}</p>
            <div className="mb-10 flex flex-wrap justify-center gap-2">
              {problems.map((p) => <span key={p} className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground">{p}</span>)}
            </div>
            <figure className="mx-auto max-w-2xl text-center">
              <Quote className="mx-auto mb-3 h-7 w-7 text-primary opacity-60" />
              <blockquote className="text-lg italic text-primary md:text-xl">{t("schools.problemQuote")}</blockquote>
            </figure>
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mb-10"><H2>{t("schools.phasesTitle")}</H2></div>
            <div className="grid gap-5 md:grid-cols-3">
              {phases.map((ph, i) => {
                const Icon = phaseIcons[i] ?? Plane;
                return (
                  <motion.div key={ph.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card rounded-2xl border border-border p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15"><Icon className="h-5 w-5 text-primary" /></div>
                    <h3 className="mb-4 font-bold text-foreground">{ph.title}</h3>
                    <List items={ph.items} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto max-w-4xl px-6">
            <div className="mb-8"><H2>{t("schools.benefitsTitle")}</H2></div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-4 text-sm font-semibold text-foreground"><Check className="h-4 w-4 shrink-0 text-primary" />{b}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container mx-auto max-w-6xl px-6">
            <p className="mx-auto mb-8 max-w-2xl text-center text-xl font-medium italic text-primary md:text-2xl">« {t("schools.teamQuote")} »</p>
            <div className="mb-10"><H2>{t("schools.teamTitle")}</H2></div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {team.map((c, i) => {
                const Icon = teamIcons[i] ?? Users;
                return (
                  <div key={c.title} className="glass-card rounded-2xl border border-border p-6">
                    <Icon className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="mb-2 font-bold text-foreground">{c.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto max-w-4xl px-6">
            <div className="mb-10"><H2>{t("schools.profilesTitle")}</H2></div>
            <div className="grid gap-5 md:grid-cols-2">
              {profiles.map((p) => (
                <div key={p.title} className="rounded-2xl border border-border border-l-4 border-l-primary bg-card/60 p-6">
                  <h3 className="mb-4 text-lg font-bold text-foreground">{p.title}</h3>
                  <List items={p.items} />
                </div>
              ))}
            </div>
            <p className="mt-6 text-center font-medium text-primary">{t("schools.profilesNote")}</p>
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container mx-auto max-w-3xl px-6">
            <H2>{t("schools.pilotTitle")}</H2>
            <p className="mb-8 text-center text-muted-foreground">{t("schools.pilotSubtitle")}</p>
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4">
                  <span className="gradient-button flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-semibold text-foreground">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center text-sm text-muted-foreground">{t("schools.pilotNote")}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="mb-10"><H2>{t("schools.winTitle")}</H2></div>
            <div className="grid gap-5 md:grid-cols-3">
              {win.map((w) => (
                <div key={w.title} className="glass-card rounded-2xl border border-border p-6">
                  <h3 className="mb-4 font-bold text-foreground">{w.title}</h3>
                  <List items={w.items} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container mx-auto max-w-3xl px-6">
            <div className="glass-card rounded-3xl border border-border p-8 md:p-10">
              <ShieldCheck className="mb-4 h-8 w-8 text-primary" />
              <h2 className="mb-3 text-2xl font-bold text-foreground">{t("schools.dataTitle")}</h2>
              <p className="mb-4 leading-relaxed text-foreground/90">{t("schools.dataBody")}</p>
              <Link to="/securite" className="text-sm font-semibold text-primary hover:underline">{t("schools.dataLink")}</Link>
            </div>
          </div>
        </section>

        <Testimonials />

        <section className="py-20">
          <div className="container mx-auto max-w-3xl px-6">
            <div className="relative overflow-hidden rounded-3xl border border-border p-10 text-center md:p-14" style={{ background: "var(--gradient-primary)" }}>
              <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
              <div className="relative">
                <img src={pipMascot.url} alt="Ping" loading="lazy" className="mx-auto mb-4 h-28 w-28 object-contain" />
                <h2 className="mb-3 text-3xl font-bold text-foreground">{t("schools.contactTitle")}</h2>
                <p className="mb-8 text-muted-foreground">{t("schools.contactBody")}</p>
                <a href={mailto} className="gradient-button inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90">
                  <Mail className="h-4 w-4" />{email}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Schools;
