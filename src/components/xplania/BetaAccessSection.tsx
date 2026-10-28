import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap, Sparkles, ArrowRight } from "lucide-react";

// Beta access in two short cards. Wording must match the limits really applied by the server
// (same AI tries for everyone today): partner schools get no hidden extra quota.
const CARDS = [
  { key: "partner", icon: GraduationCap },
  { key: "others", icon: Sparkles },
] as const;

const BetaAccessSection = () => {
  const { t } = useTranslation();
  return (
    <section id="acces-beta" className="px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-balance text-3xl font-extrabold tracking-[-.02em] sm:text-4xl"
        >
          {t("landing2.access.title")}
        </motion.h2>
        <div className="grid gap-5 md:grid-cols-2">
          {CARDS.map(({ key, icon: Icon }, i) => (
            <motion.article
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-7"
            >
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
              <h3 className="text-lg font-bold">{t(`landing2.access.${key}.title`)}</h3>
              <p className="mt-2 text-pretty leading-7 text-muted-foreground">{t(`landing2.access.${key}.text`)}</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground/90">{t(`landing2.access.${key}.note`)}</p>
            </motion.article>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link to="/offres" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            {t("landing2.access.offers")}<ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
};

export default BetaAccessSection;
