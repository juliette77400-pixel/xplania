import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, CircleDashed, FileCheck, Globe2, Loader, Luggage, Sparkles, Wallet } from "lucide-react";

interface Props {
  onCreateTrip: () => void;
}

// Hero: who Xplania is for and what it solves, readable in under five seconds.
const PREVIEW = [
  { key: "budget", icon: Wallet, status: "done" },
  { key: "visa", icon: FileCheck, status: "inProgress" },
  { key: "valise", icon: Luggage, status: "inProgress" },
  { key: "culture", icon: Globe2, status: "notStarted" },
] as const;

const HeroSection = ({ onCreateTrip }: Props) => {
  const { t } = useTranslation();
  const scrollToSteps = () => document.getElementById("comment-ca-marche")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pt-24 lg:pb-28 lg:pt-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_25%,hsl(var(--secondary)/.16),transparent_32%),radial-gradient(circle_at_80%_35%,hsl(var(--primary)/.14),transparent_30%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-primary">
            <Sparkles className="h-4 w-4" /> {t("prepLanding.hero.badge")}
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.06] tracking-[-.035em] sm:text-6xl lg:text-[4.25rem]">
            {t("prepLanding.hero.titleStart")} <span className="gradient-text">{t("prepLanding.hero.titleAccent")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">{t("prepLanding.hero.subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onCreateTrip} className="gradient-button group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-bold text-primary-foreground shadow-[0_16px_50px_hsl(var(--primary)/.16)] transition hover:-translate-y-0.5">
              {t("prepLanding.hero.primary")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={scrollToSteps} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-7 py-4 font-semibold text-foreground transition hover:border-primary/50">
              {t("prepLanding.hero.secondary")}
            </button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><Check className="h-4 w-4 text-primary" />{t("prepLanding.hero.note")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .7, delay: .1 }} className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-secondary/20 to-primary/20 blur-3xl" />
          <div className="rounded-[2rem] border border-border/60 bg-card/80 p-3 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.45rem] border border-border/70 bg-background/80 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{t("prepLanding.hero.previewLabel")}</p>
              <p className="mt-1 text-lg font-bold">{t("prepLanding.hero.previewExample")}</p>
              <div className="mt-5 grid gap-2.5">
                {PREVIEW.map(({ key, icon: Icon, status }, i) => {
                  const StatusIcon = status === "done" ? Check : status === "inProgress" ? Loader : CircleDashed;
                  return (
                    <motion.div key={key} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .45 + i * .1 }}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
                      <span className="gradient-button flex h-8 w-8 items-center justify-center rounded-lg"><Icon className="h-4 w-4 text-primary-foreground" /></span>
                      <span className="flex-1 font-medium">{t(`prepDashboard.modules.${key}.title`)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs ${status === "notStarted" ? "text-muted-foreground" : "text-primary"}`}>
                        <StatusIcon className="h-3.5 w-3.5" />{t(`prepDashboard.status.${status}`)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">{t("prepLanding.hero.previewNote")}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
