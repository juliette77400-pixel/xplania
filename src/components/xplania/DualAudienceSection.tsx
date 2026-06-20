import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Compass, Briefcase } from "lucide-react";

const DualAudienceSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm text-primary font-medium uppercase tracking-wider mb-2">
            {t("home.dualAudience.kicker")}
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold">
            {t("home.dualAudience.title")}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: Compass,
              title: t("home.dualAudience.youngTitle"),
              text: t("home.dualAudience.youngText"),
              accent: "from-primary/30 to-primary/5",
            },
            {
              icon: Briefcase,
              title: t("home.dualAudience.nomadTitle"),
              text: t("home.dualAudience.nomadText"),
              accent: "from-accent/30 to-accent/5",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 md:p-8 border border-border/40 hover:border-primary/40 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center mb-4`}
              >
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{card.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DualAudienceSection;
