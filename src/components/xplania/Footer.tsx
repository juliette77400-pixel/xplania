import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Plane, Star, Luggage, Wallet, FileText, MessageSquare, Sparkles, Mail } from "lucide-react";

const stars = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 2 + 1,
  delay: Math.random() * 5,
  opacity: Math.random() * 0.4 + 0.1,
}));

interface Props {
  onFeedback?: () => void;
  onCreateTrip?: () => void;
}

const Footer = (_: Props) => {
  const { t } = useTranslation();

  const scrollToFeedback = () => {
    const el = document.getElementById("feedback");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const featureLinks = [
    { icon: Luggage, label: t("features.items.valise.title") },
    { icon: Wallet, label: t("features.items.budget.title") },
    { icon: FileText, label: t("features.items.visa.title") },
  ];

  return (
    <footer className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(230 50% 4%) 50%, hsl(240 40% 2%) 100%)" }}>
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: `hsla(185, 85%, 75%, ${s.opacity})`,
            animation: `float ${4 + s.delay}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <div className="relative z-10 container mx-auto px-6 pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Xplania</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {t("footer.tagline")}
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-primary border border-primary/30 bg-primary/5 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              {t("footer.version")}
            </span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">{t("footer.featuresTitle")}</h4>
            <ul className="space-y-3">
              {featureLinks.map((item) => (
                <li key={item.label}>
                  <a href="#features" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
                    <item.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">{t("footer.contactTitle")}</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={scrollToFeedback}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <MessageSquare className="w-4 h-4 group-hover:text-primary transition-colors" />
                  {t("footer.feedbackLink")}
                </button>
              </li>
              <li>
                <a
                  href="mailto:juliettenoel.xplania@gmail.com"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Mail className="w-4 h-4 group-hover:text-primary transition-colors" />
                  juliettenoel.xplania@gmail.com
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="my-10 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsla(210, 40%, 96%, 0.1), hsla(185, 85%, 55%, 0.15), hsla(210, 40%, 96%, 0.1), transparent)" }} />

        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center gap-3 mb-10">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold text-secondary-foreground" style={{ background: "linear-gradient(135deg, hsla(270, 70%, 55%, 0.3), hsla(270, 70%, 55%, 0.15))", border: "1px solid hsla(270, 70%, 55%, 0.3)" }}>
            <Star className="w-3.5 h-3.5" />
            {t("footer.betaBadge")}
          </span>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            {t("footer.betaNote")}
          </p>
        </motion.div>

        <div className="text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("footer.prototype")}</p>
          <p className="text-xs text-muted-foreground/60">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
