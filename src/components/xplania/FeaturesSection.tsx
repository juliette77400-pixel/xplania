import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Luggage, Wallet, FileText, BookOpen, Activity, Compass, Heart, MapPinned, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURE_KEYS = [
  { key: "valise", num: 1, icon: Luggage, link: "/guide-valise" },
  { key: "budget", num: 2, icon: Wallet, link: "/guide-budget" },
  { key: "visa", num: 3, icon: FileText, link: "/guide-visa" },
  { key: "journal", num: 4, icon: BookOpen, link: "/carnets" },
  { key: "tracking", num: 5, icon: Activity, link: "/suivi" },
  { key: "explore", num: 6, icon: Compass, link: "/explore" },
  { key: "mood", num: 7, icon: Heart, link: "/mood" },
  { key: "discover", num: 8, icon: MapPinned, link: "/discover" },
] as const;

const FeaturesSection = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">{t("features.tag")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("features.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("features.subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {FEATURE_KEYS.map((f, i) => (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-2xl p-6 flex flex-col group hover:border-primary/20 transition-colors"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("features.labelN", { n: f.num })}
              </span>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t(`features.items.${f.key}.title`)}</h3>
              </div>
              <p className="mt-2 text-sm font-medium text-primary">{t(`features.items.${f.key}.tagline`)}</p>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{t(`features.items.${f.key}.description`)}</p>
              <ul className="mt-4 space-y-2 flex-1">
                {[1, 2].map((n) => (
                  <li key={n} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {t(`features.items.${f.key}.benefit${n}`)}
                  </li>
                ))}
              </ul>
              <Link
                to={f.link}
                className="mt-6 flex items-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all"
              >
                {t(`features.items.${f.key}.cta`)}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">{t("features.noSignup")}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
