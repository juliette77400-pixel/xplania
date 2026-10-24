import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Gauge, Layers3, Target } from "lucide-react";

const BENEFITS = [
  { key: "oneplace", icon: Layers3 },
  { key: "remaining", icon: Gauge },
  { key: "adapted", icon: Target },
] as const;

const BenefitsSection = () => {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="benefits-title" className="border-y border-border/60 bg-card/25 px-4 py-14 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 id="benefits-title" className="mx-auto max-w-3xl text-balance text-center text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{t("prepLanding.benefits.title")}</h2>
        <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto -mx-4 px-4 pb-3 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:mt-12 md:grid md:grid-cols-3 md:gap-5">
          {BENEFITS.map(({ key, icon: Icon }, i) => (
            <motion.li key={key} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
              className="rounded-2xl border border-border/70 bg-card/60 p-6 text-center w-[82%] shrink-0 snap-start md:w-auto">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><Icon className="h-6 w-6 text-primary" /></div>
              <h3 className="text-lg font-bold">{t(`prepLanding.benefits.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`prepLanding.benefits.${key}.desc`)}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default BenefitsSection;
