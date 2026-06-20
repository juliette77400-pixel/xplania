import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plane, Map, BookOpen } from "lucide-react";

const JourneyTimelineSection = () => {
  const { t } = useTranslation();
  const steps = [
    {
      icon: Plane,
      title: t("home.journey.beforeTitle"),
      text: t("home.journey.beforeText"),
    },
    {
      icon: Map,
      title: t("home.journey.duringTitle"),
      text: t("home.journey.duringText"),
    },
    {
      icon: BookOpen,
      title: t("home.journey.afterTitle"),
      text: t("home.journey.afterText"),
    },
  ];

  return (
    <section className="py-20 px-4 bg-card/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm text-primary font-medium uppercase tracking-wider mb-2">
            {t("home.journey.kicker")}
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold max-w-2xl mx-auto">
            {t("home.journey.title")}
          </h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6 md:gap-4">
          {/* connector line desktop */}
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center mb-4 relative z-10">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
                {i + 1}
              </p>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                {s.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JourneyTimelineSection;
