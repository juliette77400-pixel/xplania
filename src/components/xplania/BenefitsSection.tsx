import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock, Shield, BarChart3 } from "lucide-react";

const BenefitsSection = () => {
  const { t } = useTranslation();
  const benefits = [
    { icon: Clock, title: t("benefits.timeTitle"), desc: t("benefits.timeDesc") },
    { icon: Shield, title: t("benefits.calmTitle"), desc: t("benefits.calmDesc") },
    { icon: BarChart3, title: t("benefits.controlTitle"), desc: t("benefits.controlDesc") },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("benefits.titlePart1")}{" "}
            <span className="gradient-text">{t("benefits.titlePart2")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
            {t("benefits.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl gradient-button flex items-center justify-center mb-5">
                <b.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{b.title}</h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
