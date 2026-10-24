import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, FileCheck, Globe2, Luggage, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { isPathEnabled } from "@/config/featureFlags";

// "La solution": the four guides shown as one preparation path, not four products.
const TOOLS = [
  { key: "budget", to: "/guide-budget", icon: Wallet },
  { key: "visa", to: "/guide-visa", icon: FileCheck },
  { key: "valise", to: "/guide-valise", icon: Luggage },
  { key: "culture", to: "/guide-culture", icon: Globe2 },
] as const;

const FeaturesSection = () => {
  const { t } = useTranslation();
  const tools = TOOLS.filter((tool) => isPathEnabled(tool.to));
  return (
    <section id="features" aria-labelledby="solution-title" className="px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="solution-title" className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("prepLanding.solution.title")}</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{t("prepLanding.solution.subtitle")}</p>
        </div>
        <div className="relative mt-14">
          {/* One shared path linking the four guides */}
          <div aria-hidden className="absolute left-[12%] right-[12%] top-[2.1rem] hidden h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 lg:block" />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map(({ key, to, icon: Icon }, i) => (
              <motion.li key={key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}>
                <Link to={to} className="group relative flex h-full flex-col rounded-[1.5rem] border border-border/70 bg-card/60 p-6 interactive-card">
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
