import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight, Clock, Luggage, Wallet, FileText, BookOpen, Activity, Compass, Heart, MapPinned, Star, PlayCircle, Users } from "lucide-react";

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: Math.random() * 4,
}));

interface Props {
  onCreateTrip: () => void;
  onDemoTrip?: () => void;
}

const HeroSection = ({ onCreateTrip, onDemoTrip }: Props) => {
  const { t } = useTranslation();

  const tools = [
    { icon: Luggage, label: t("hero.toolSuitcase") },
    { icon: Wallet, label: t("hero.toolBudget") },
    { icon: FileText, label: t("hero.toolVisa") },
    { icon: BookOpen, label: t("hero.toolJournal") },
    { icon: Activity, label: t("hero.toolLive") },
    { icon: Compass, label: t("hero.toolMap") },
    { icon: Heart, label: t("hero.toolMood") },
    { icon: MapPinned, label: t("hero.toolDiscover") },
  ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{ left: p.left, top: p.top, animationDelay: `${p.delay}s` }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-primary mb-8"
      >
        <Sparkles className="w-4 h-4" />
        <span>{t("hero.badge")}</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-center max-w-4xl leading-tight"
      >
        {t("hero.titleLine1")}
        <br />
        <span className="gradient-text">{t("hero.titleLine2")}</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mt-6 text-center text-muted-foreground text-lg max-w-2xl"
      >
        {t("hero.subtitle")}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.32 }}
        className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Users className="w-4 h-4 text-primary" />
        <span>{t("hero.forWho")}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 mt-8"
      >
        <button
          onClick={onCreateTrip}
          className="gradient-button px-8 py-4 rounded-xl text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-5 h-5" />
          {t("hero.ctaCreate")}
        </button>
        {onDemoTrip && (
          <button
            onClick={onDemoTrip}
            className="glass-card px-8 py-4 rounded-xl text-foreground font-semibold flex items-center gap-2 hover:bg-muted transition-colors border border-primary/20"
          >
            <PlayCircle className="w-5 h-5 text-primary" />
            {t("hero.ctaDemo")}
          </button>
        )}
        <a
          href="#features"
          className="px-6 py-4 rounded-xl text-muted-foreground font-medium flex items-center gap-2 hover:text-foreground transition-colors"
        >
          {t("hero.ctaDiscover")}
          <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="mt-12 w-full max-w-2xl glass-card rounded-2xl p-6"
      >
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="w-full">
            <p className="text-sm font-semibold text-foreground">
              {t("hero.toolsIntro")} <span className="text-primary">{t("hero.toolsCount")}</span> {t("hero.toolsAvail")}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {tools.map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs text-foreground font-medium"
                >
                  <item.icon className="w-3.5 h-3.5 text-primary" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Star className="w-4 h-4 text-accent" />
        <span>
          <strong className="text-foreground">{t("hero.earlyExplorer")}</strong> — {t("hero.earlyExplorerDesc")}
        </span>
      </motion.div>
    </section>
  );
};

export default HeroSection;
