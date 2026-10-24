import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, BedDouble, Check, CircleDashed, FileCheck, Globe2, GraduationCap, ListTodo, Loader, Luggage, MapPin, Sparkles, Wallet } from "lucide-react";
import { track } from "@/lib/analytics";

interface Props {
  onCreateTrip: () => void;
}

// Hero: who Xplania is for, the pain and the solution, readable in under five seconds.
// The preview is an illustration (labelled as such), not real data.
const PREVIEW = [
  { key: "budget", icon: Wallet, state: "active" },
  { key: "visa", icon: FileCheck, state: "active" },
  { key: "valise", icon: Luggage, state: "todo" },
  { key: "culture", icon: Globe2, state: "todo" },
  { key: "housing", icon: BedDouble, state: "active" },
] as const;

const HeroSection = ({ onCreateTrip }: Props) => {
  const { t } = useTranslation();
  const scrollToSteps = () => {
    track("cta_click", { cta: "how_it_works", location: "hero" });
    document.getElementById("comment-ca-marche")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:pt-20 lg:pb-24 lg:pt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_25%,hsl(var(--secondary)/.16),transparent_32%),radial-gradient(circle_at_80%_35%,hsl(var(--primary)/.14),transparent_30%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-primary">
            <Sparkles className="h-4 w-4" /> {t("prepLanding.hero.badge")}
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-[-.03em] sm:text-5xl xl:text-6xl">
            {t("prepLanding.hero.titleStart")} <span className="gradient-text">{t("prepLanding.hero.titleAccent")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">{t("prepLanding.hero.subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onCreateTrip} className="gradient-button group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-bold text-primary-foreground shadow-[0_16px_50px_hsl(var(--primary)/.16)] transition hover:-translate-y-0.5">
              {t("prepLanding.cta")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </button>
            <button onClick={scrollToSteps} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-7 py-4 font-semibold text-foreground transition hover:border-primary/50">
              {t("prepLanding.hero.secondary")}
            </button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><Check className="h-4 w-4 text-primary" aria-hidden />{t("prepLanding.reassurance")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .7, delay: .1 }} className="relative mx-auto w-full max-w-md lg:max-w-lg">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-secondary/20 to-primary/20 blur-3xl" />
          <figure aria-label={t("prepLanding.hero.previewAria")} className="rounded-[2rem] border border-border/60 bg-card/80 p-3 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.45rem] border border-border/70 bg-background/80 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-lg font-bold"><MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />{t("prepLanding.hero.previewPlace")}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><GraduationCap className="h-4 w-4 shrink-0" aria-hidden />{t("prepLanding.hero.previewStay")}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{t("prepLanding.hero.previewLabel")}</span>
              </div>
              <ul className="mt-5 grid gap-2">
                {PREVIEW.map(({ key, icon: Icon, state }, i) => {
                  const StatusIcon = state === "active" ? Loader : CircleDashed;
                  return (
                    <motion.li key={key} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4 + i * .08 }}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5 text-sm">
                      <span className="gradient-button flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><Icon className="h-4 w-4 text-primary-foreground" aria-hidden /></span>
                      <span className="min-w-0 flex-1 truncate font-medium">{t(`prepDashboard.modules.${key}.title`)}</span>
                      <span className={`inline-flex shrink-0 items-center gap-1 text-xs ${state === "active" ? "text-primary" : "text-muted-foreground"}`}>
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden />{t(`prepLanding.hero.preview.${key}`)}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
              <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.12em] text-primary"><ListTodo className="h-3.5 w-3.5" aria-hidden />{t("prepLanding.hero.nextTitle")}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>· {t("prepLanding.hero.next1")}</li>
                  <li>· {t("prepLanding.hero.next2")}</li>
                </ul>
              </div>
              <figcaption className="mt-3 text-[11px] text-muted-foreground">{t("prepLanding.hero.previewNote")}</figcaption>
            </div>
          </figure>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
