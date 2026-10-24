import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, BedDouble, FileCheck, Wallet } from "lucide-react";
import { previewSteps } from "@/lib/prep-preview";
import { emptyPrepAnswers, type PrepAnswers } from "@/lib/prep-quiz";
import imgStudent from "@/assets/prep-quiz/stay-erasmus.jpg";

interface Props {
  onStart: () => void;
}

// Fixed example run through the real preview rules of the questionnaire, so
// the landing shows exactly what a student gets (always labelled "Example").
export const LANDING_EXAMPLE: PrepAnswers = {
  ...emptyPrepAnswers(),
  destinationCode: "ES",
  nationality: "FR",
  residence: "FR",
  stayType: "erasmus",
  durationBucket: "3to6",
  budget: "900",
  housing: "flatshare",
  housingStatus: "starting",
};

const ICONS = { visa: FileCheck, housing: BedDouble, budget: Wallet } as const;

const ResultSection = ({ onStart }: Props) => {
  const { t } = useTranslation();
  const steps = previewSteps(LANDING_EXAMPLE);
  const country = t("landing2.result.country");

  return (
    <section id="comment-ca-marche" className="scroll-mt-20 px-4 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{t("landing2.result.kicker")}</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-[-.02em] sm:text-4xl">{t("landing2.result.title")}</h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{t("landing2.result.text")}</p>
          <ol className="mt-6 space-y-3">
            {(["step1", "step2", "step3"] as const).map((k, i) => (
              <li key={k} className="flex items-center gap-3 text-sm font-medium">
                <span className="gradient-button flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">{i + 1}</span>
                {t(`landing2.result.${k}`)}
              </li>
            ))}
          </ol>
          <button onClick={onStart} className="gradient-button group mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-4 font-bold text-primary-foreground transition hover:-translate-y-0.5">
            {t("prepLanding.cta")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/15 to-secondary/15 blur-2xl" />
          <figure className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
            <img src={imgStudent} alt="" loading="lazy" width={800} height={600} className="aspect-[16/7] w-full object-cover" />
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-primary">{t("prepQuiz.preview.kicker")}</p>
                <span className="rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{t("landing2.result.exampleLabel")}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t("landing2.result.exampleStay")}</p>
              <ul className="mt-4 space-y-3">
                {steps.map((st, i) => {
                  const Icon = ICONS[st.module];
                  return (
                    <li key={st.id} className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15"><Icon className="h-4 w-4 text-primary" aria-hidden /></span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-primary">{t("prepQuiz.preview.priority", { n: i + 1 })} · {t(`prepQuiz.preview.module.${st.module}`)}</span>
                        <span className="mt-0.5 block text-sm font-medium leading-snug">{t(`prepQuiz.preview.steps.${st.key}`, { country, ...(st.vars || {}) })}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </figure>
        </motion.div>
      </div>
    </section>
  );
};

export default ResultSection;
