import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const HowItWorksSection = () => {
  const { t } = useTranslation();
  const steps = [
    { num: 1, title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { num: 2, title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { num: 3, title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t("howItWorks.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("howItWorks.subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl gradient-button flex items-center justify-center text-2xl font-bold text-primary-foreground mb-5">
                {s.num}
              </div>
              <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
