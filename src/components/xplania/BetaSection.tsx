import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { GraduationCap, MessageSquare, Zap } from "lucide-react";

interface Props {
  onFeedback: () => void;
}

// Trust and participation: free access, feedback, ESTICE student beta. No invented figures.
const BetaSection = ({ onFeedback }: Props) => {
  const { t } = useTranslation();
  const cards = [
    { icon: Zap, title: t("beta.earlyTitle"), desc: t("beta.earlyDesc") },
    { icon: MessageSquare, title: t("beta.feedbackTitle"), desc: t("beta.feedbackDesc") },
    { icon: GraduationCap, title: t("beta.communityTitle"), desc: t("beta.communityDesc") },
  ];

  return (
    <section id="feedback" aria-labelledby="beta-title" className="scroll-mt-20 px-4 py-14 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-12 max-w-3xl text-center">
          <h2 id="beta-title" className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("beta.titlePart1")} <span className="gradient-text">{t("beta.titlePart2")}</span>
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">{t("beta.subtitle")}</p>
        </motion.div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto -mx-4 px-4 pb-3 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:grid-cols-3 md:gap-5">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card h-full rounded-2xl p-6 text-center w-[82%] shrink-0 snap-start md:w-auto"
            >
              <div className="gradient-button mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                <c.icon className="h-5 w-5 text-primary-foreground" aria-hidden />
              </div>
              <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={onFeedback}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/40 px-7 py-3.5 font-semibold text-foreground transition hover:border-primary/50"
          >
            <MessageSquare className="h-5 w-5 text-primary" aria-hidden />
            {t("beta.shareCta")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default BetaSection;
