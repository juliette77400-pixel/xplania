import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, MapPinned } from "lucide-react";
import { DESTINATION_PAGES, DESTINATIONS_HUB, destinationPath } from "@/data/destination-pages";
import { isPathEnabled } from "@/config/featureFlags";
import { isOpenTool } from "@/config/open-tools";
import { track } from "@/lib/analytics";
import imgBudget from "@/assets/prep-quiz/budget.jpg";
import imgVisa from "@/assets/prep-quiz/origin.jpg";
import imgHousing from "@/assets/prep-quiz/housing-status-starting.jpg";
import imgValise from "@/assets/prep-quiz/housing-unknown.jpg";
import imgCulture from "@/assets/prep-quiz/housing-family.jpg";

// The 5 tools, presented once, as the questions a student actually asks.
const ITEMS = [
  { key: "budget", to: "/guide-budget", img: imgBudget },
  { key: "visa", to: "/guide-visa", img: imgVisa },
  { key: "housing", to: "/guide-logement", img: imgHousing },
  { key: "valise", to: "/guide-valise", img: imgValise },
  { key: "culture", to: "/guide-culture", img: imgCulture },
] as const;

const QuestionsSection = () => {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  const items = ITEMS.filter((it) => isPathEnabled(it.to));

  return (
    <section id="questions" className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{t("landing2.questions.kicker")}</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-[-.02em] sm:text-4xl">{t("landing2.questions.title")}</h2>
          <p className="mt-4 text-pretty text-muted-foreground">{t("landing2.questions.subtitle")}</p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {items.map((it, i) => (
            <motion.div
              key={it.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={i < 2 ? "lg:col-span-3" : "lg:col-span-2"}
            >
              <Link
                to={it.to}
                onClick={() => track("cta_click", { cta: `question_${it.key}`, location: "questions" })}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/60 transition hover:-translate-y-1 hover:border-primary/50"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={it.img}
                    alt={t(`landing2.questions.imgAlt.${it.key}`)}
                    loading="lazy"
                    width={800}
                    height={600}
                    className={`w-full object-cover transition duration-500 group-hover:scale-105 ${i < 2 ? "aspect-[16/8]" : "aspect-[16/10]"}`}
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur">
                    {isOpenTool(it.to) ? t("landing2.questions.open") : t("landing2.questions.account")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-balance text-xl font-bold leading-snug">{t(`landing2.questions.${it.key}.q`)}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t(`landing2.questions.${it.key}.a`)}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {t("landing2.questions.link")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Public country guides, reachable from the features as well as the footer. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 rounded-3xl border border-border/60 bg-card/60 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary" aria-hidden><MapPinned className="h-5 w-5" /></span>
              <div>
                <h3 className="text-xl font-bold">{t("landing2.questions.countries.title")}</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("landing2.questions.countries.subtitle")}</p>
              </div>
            </div>
            <Link
              to={DESTINATIONS_HUB}
              onClick={() => track("cta_click", { cta: "country_guides_all", location: "questions" })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              {t("landing2.questions.countries.all")}<ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {DESTINATION_PAGES.map((d) => (
              <li key={d.slug}>
                <Link
                  to={destinationPath(d)}
                  onClick={() => track("cta_click", { cta: `country_guide_${d.slug}`, location: "questions" })}
                  className="inline-flex min-h-[40px] items-center rounded-full border border-border/70 bg-muted/30 px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {isFr ? d.nameFr : d.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

export default QuestionsSection;
