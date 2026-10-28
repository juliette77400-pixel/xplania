import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Layers, MapPin, UserRound } from "lucide-react";

// Shows what the advice is really based on (only data the questionnaire actually collects).
const BADGES = [
  { key: "profile", icon: UserRound },
  { key: "destination", icon: MapPin },
  { key: "together", icon: Layers },
] as const;

const PersonalizationSection = () => {
  const { t } = useTranslation();
  return (
    <section id="personnalisation" className="px-4 py-14 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-card/50 p-6 text-center backdrop-blur-sm sm:p-10"
      >
        <h2 className="text-balance text-3xl font-extrabold tracking-[-.02em] sm:text-4xl">{t("landing2.perso.title")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty leading-7 text-muted-foreground">{t("landing2.perso.text")}</p>
        <ul className="mt-7 flex flex-wrap justify-center gap-3">
          {BADGES.map(({ key, icon: Icon }) => (
            <li key={key} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-foreground">
              <Icon className="h-4 w-4 text-primary" aria-hidden />{t(`landing2.perso.badges.${key}`)}
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
};

export default PersonalizationSection;
