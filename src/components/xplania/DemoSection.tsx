import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, BedDouble, CalendarDays, FileCheck, Globe2, GraduationCap, Home, Luggage, MapPin, Wallet } from "lucide-react";

// Shows why one trip profile beats five separate guides: the same answers feed
// every tool. Illustrative example only — every line matches what the tools use today.
const PROFILE = [
  { key: "destination", icon: MapPin },
  { key: "stay", icon: GraduationCap },
  { key: "duration", icon: CalendarDays },
  { key: "housing", icon: Home },
] as const;

const USES = [
  { key: "budget", icon: Wallet },
  { key: "visa", icon: FileCheck },
  { key: "valise", icon: Luggage },
  { key: "culture", icon: Globe2 },
  { key: "housing", icon: BedDouble },
] as const;

const DemoSection = () => {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="demo-title" className="border-y border-border/60 bg-card/25 px-4 py-14 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="demo-title" className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{t("prepLanding.demo.title")}</h2>
          <p className="mt-5 text-pretty text-lg leading-8 text-muted-foreground">{t("prepLanding.demo.subtitle")}</p>
        </div>

        <div className="mt-12 grid items-center gap-6 lg:grid-cols-[.8fr_auto_1.2fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl border border-primary/30 bg-background/70 p-6">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{t("prepLanding.demo.profileTitle")}</p>
            <dl className="mt-4 space-y-3">
              {PROFILE.map(({ key, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <dt className="text-muted-foreground">{t(`prepLanding.demo.profile.${key}.label`)}</dt>
                  <dd className="ml-auto text-right font-semibold">{t(`prepLanding.demo.profile.${key}.value`)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[11px] text-muted-foreground">{t("prepLanding.demo.exampleNote")}</p>
          </motion.div>

          <ArrowRight className="mx-auto hidden h-8 w-8 text-primary lg:block" aria-hidden />

          <ul className="grid gap-3 sm:grid-cols-2">
            {USES.map(({ key, icon: Icon }, i) => (
              <motion.li key={key} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .06 }}
                className={`flex items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-4 ${key === "housing" ? "sm:col-span-2" : ""}`}>
                <span className="gradient-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"><Icon className="h-4 w-4 text-primary-foreground" aria-hidden /></span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold">{t(`prepDashboard.modules.${key}.title`)}</h3>
                  <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{t(`prepLanding.demo.uses.${key}`)}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="mx-auto mt-12 max-w-3xl text-balance text-center text-xl font-bold sm:text-2xl">{t("prepLanding.demo.conclusion")}</p>
      </div>
    </section>
  );
};

export default DemoSection;
