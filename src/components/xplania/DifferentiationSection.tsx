import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Clock, Sparkles, LayoutGrid } from "lucide-react";

const DifferentiationSection = () => {
  const { t } = useTranslation();
  const points = [
    { icon: Clock, title: t("home.differentiation.point1Title"), text: t("home.differentiation.point1Text") },
    { icon: Sparkles, title: t("home.differentiation.point2Title"), text: t("home.differentiation.point2Text") },
    { icon: LayoutGrid, title: t("home.differentiation.point3Title"), text: t("home.differentiation.point3Text") },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm text-primary font-medium uppercase tracking-wider mb-3">
          {t("home.differentiation.kicker")}
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-extrabold leading-tight mb-12"
        >
          <span className="text-muted-foreground">ChatGPT génère.</span>
          <br />
          <span className="gradient-text">Xplania accompagne.</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-border/40 bg-card/30 p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold mb-1.5">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DifferentiationSection;
