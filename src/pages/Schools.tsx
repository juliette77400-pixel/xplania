import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Mail, FileText, Wallet, MapPin, Trophy, ShieldCheck, School, AlertCircle } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import Footer from "@/components/xplania/Footer";

const benefitIcons = [FileText, Wallet, MapPin, Trophy];

const Schools = () => {
  const { t } = useTranslation();
  const problems = (t("schools.problems", { returnObjects: true }) as string[]) || [];
  const benefits = (t("schools.benefits", { returnObjects: true }) as Array<{ title: string; desc: string }>) || [];
  const steps = (t("schools.pilotSteps", { returnObjects: true }) as Array<{ title: string; desc: string }>) || [];
  const email = t("about.cta.email");
  const mailto = `mailto:${email}?subject=${encodeURIComponent(t("schools.mailSubject"))}`;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-28">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "var(--gradient-primary)" }} />
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
          <div className="container mx-auto max-w-3xl px-6">
            <h2 className="mb-6 text-center text-2xl font-bold text-foreground md:text-3xl">{t("schools.problemTitle")}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {problems.map((p) => (
                <li key={p} className="glass-card flex items-start gap-3 rounded-2xl border border-border p-4 text-sm text-foreground/90">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container mx-auto max-w-6xl px-6">
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground md:text-3xl">{t("schools.benefitsTitle")}</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b, i) => {
                const Icon = benefitIcons[i] ?? FileText;
                return (
                  <motion.div key={b.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card rounded-2xl border border-border p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15"><Icon className="h-5 w-5 text-primary" /></div>
                    <h3 className="mb-2 font-bold text-foreground">{b.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto max-w-5xl px-6">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">{t("schools.pilotTitle")}</h2>
              <p className="text-muted-foreground">{t("schools.pilotSubtitle")}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.title} className="rounded-2xl border border-border border-l-4 border-l-primary bg-card/60 p-6">
                  <h3 className="mb-2 font-bold text-foreground">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm font-medium text-primary">{t("schools.pilotNote")}</p>
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

        <section className="py-20">
          <div className="container mx-auto max-w-3xl px-6">
            <div className="relative overflow-hidden rounded-3xl border border-border p-10 text-center md:p-14" style={{ background: "var(--gradient-primary)" }}>
              <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
              <div className="relative">
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
