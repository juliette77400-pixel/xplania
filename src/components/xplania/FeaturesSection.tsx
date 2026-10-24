import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BedDouble, Check, FileCheck, Globe2, Luggage, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { isPathEnabled } from "@/config/featureFlags";

// "La solution": the preparation tools shown as one path, not separate products.
const TOOLS = [
  { key: "budget", to: "/guide-budget", icon: Wallet },
  { key: "visa", to: "/guide-visa", icon: FileCheck },
  { key: "valise", to: "/guide-valise", icon: Luggage },
  { key: "culture", to: "/guide-culture", icon: Globe2 },
  { key: "housing", to: "/guide-logement", icon: BedDouble },
] as const;

const FeaturesSection = () => {
  const { t } = useTranslation();
  const tools = TOOLS.filter((tool) => isPathEnabled(tool.to));
  return (
    <section id="features" aria-labelledby="solution-title" className="px-4 py-14 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="solution-title" className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{t("prepLanding.solution.title")}</h2>
          <p className="mt-5 text-pretty text-lg leading-8 text-muted-foreground">{t("prepLanding.solution.subtitle")}</p>
        </div>
        <div className="relative mt-8 sm:mt-14">
          {/* One shared path linking the tools (single row on wide screens) */}
          <div aria-hidden className="absolute left-[10%] right-[10%] top-[2.1rem] hidden h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 xl:block" />
          {/* Flex-wrap keeps an incomplete last row centred instead of leaving one card alone on the left. */}
          <ol className="flex snap-x snap-mandatory gap-4 overflow-x-auto -mx-4 px-4 pb-3 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0">
            {tools.map(({ key, to, icon: Icon }, i) => (
              <motion.li key={key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}
                className="w-[82%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.84rem)] xl:w-[calc(20%-1rem)]">
                <Link to={to} className="group relative flex h-full flex-col rounded-[1.5rem] border border-border/70 bg-card/60 p-5 interactive-card">
                  <div className="gradient-button relative flex h-11 w-11 items-center justify-center rounded-xl"><Icon className="h-5 w-5 text-primary-foreground" /></div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-primary">{t("prepLanding.solution.stepLabel", { n: i + 1 })}</p>
                  <h3 className="mt-1 text-xl font-bold">{t(`prepLanding.solution.cards.${key}.name`)}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{t(`prepLanding.solution.cards.${key}.desc`)}</p>
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t(`prepLanding.solution.cards.${key}.benefit`)}
                  </p>
                </Link>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
