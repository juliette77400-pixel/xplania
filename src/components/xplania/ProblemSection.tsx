import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Compass, Layers3, ListX } from "lucide-react";

// One central pain: preparing a stay abroad is scattered and complicated.
const ITEMS = [
  { key: "scattered", icon: Layers3 },
  { key: "forget", icon: ListX },
  { key: "bearings", icon: Compass },
] as const;

const ProblemSection = () => {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="problem-title" className="border-y border-border/60 bg-card/25 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <h2 id="problem-title" className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{t("prepLanding.problem.title")}</h2>
          <p className="mt-5 text-pretty text-lg leading-8 text-muted-foreground">{t("prepLanding.problem.text")}</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {ITEMS.map(({ key, icon: Icon }, i) => (
            <motion.article key={key} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}
              className="h-full rounded-2xl border border-border/70 bg-background/60 p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10"><Icon className="h-5 w-5 text-destructive" /></div>
              <h3 className="text-lg font-bold"><span className="mr-1 text-muted-foreground">{i + 1}.</span>{t(`prepLanding.problem.items.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`prepLanding.problem.items.${key}.desc`)}</p>
            </motion.article>
          ))}
        </div>
        <p className="mt-12 text-balance text-center text-2xl font-bold sm:text-3xl">{t("prepLanding.problem.conclusion")}</p>
      </div>
    </section>
  );
};

export default ProblemSection;
