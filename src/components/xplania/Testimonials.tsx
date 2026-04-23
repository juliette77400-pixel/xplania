import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const { t } = useTranslation();

  const items = [
    {
      name: t("testimonials.t1.name"),
      role: t("testimonials.t1.role"),
      text: t("testimonials.t1.text"),
    },
    {
      name: t("testimonials.t2.name"),
      role: t("testimonials.t2.role"),
      text: t("testimonials.t2.text"),
    },
    {
      name: t("testimonials.t3.name"),
      role: t("testimonials.t3.role"),
      text: t("testimonials.t3.text"),
    },
  ];

  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary mb-3">
            {t("testimonials.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("testimonials.title")}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 flex flex-col"
            >
              <Quote className="w-8 h-8 text-primary/40 mb-3" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed flex-1 mb-4">
                "{item.text}"
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                <div className="w-10 h-10 rounded-full gradient-button flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
