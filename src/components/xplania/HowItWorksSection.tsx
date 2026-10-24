import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, LayoutDashboard, MapPin, Route } from "lucide-react";

interface Props {
  onStart: () => void;
}

const STEPS = [
  { key: "s1", icon: MapPin },
  { key: "s2", icon: LayoutDashboard },
  { key: "s3", icon: Route },
] as const;

const HowItWorksSection = ({ onStart }: Props) => {
  const { t } = useTranslation();
  return (
    <section id="comment-ca-marche" aria-labelledby="how-title" className="scroll-mt-20 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 id="how-title" className="text-balance text-center text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{t("prepLanding.how.title")}</h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ key, icon: Icon }, i) => (
            <motion.li key={key} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
              className="rounded-2xl border border-border/70 bg-background/60 p-6">
              <div className="flex items-center gap-3">
                <span className="gradient-button flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-primary-foreground">{i + 1}</span>
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-bold">{t(`prepLanding.how.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`prepLanding.how.${key}.desc`)}</p>
            </motion.li>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <button onClick={onStart} className="gradient-button inline-flex items-center gap-2 rounded-xl px-7 py-4 font-bold text-primary-foreground transition hover:-translate-y-0.5">
            {t("prepLanding.cta")}<ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
