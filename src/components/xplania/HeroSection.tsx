import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Clock, Luggage, Wallet, FileText, Star } from "lucide-react";

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: Math.random() * 4,
}));

interface Props {
  onCreateTrip: () => void;
}

const HeroSection = ({ onCreateTrip }: Props) => {
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
        <span>Bêta Privée — Accès Exclusif</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-center max-w-4xl leading-tight"
      >
        Voyagez sereinement,
        <br />
        <span className="gradient-text">l'IA s'occupe du reste</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mt-6 text-center text-muted-foreground text-lg max-w-2xl"
      >
        Xplania est votre copilote de voyage intelligent. Budget, visas, bagages : toute la préparation centralisée en un seul endroit.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 mt-10"
      >
        <button
          onClick={onCreateTrip}
          className="gradient-button px-8 py-4 rounded-xl text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-5 h-5" />
          Créer mon voyage gratuitement
        </button>
        <a
          href="#features"
          className="glass-card px-8 py-4 rounded-xl text-foreground font-semibold flex items-center gap-2 hover:bg-muted transition-colors"
        >
          Découvrir les fonctionnalités
          <ArrowRight className="w-5 h-5" />
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
          <div>
            <p className="text-sm font-semibold text-foreground">
              Bêta gratuite — trois outils déjà disponibles pour préparer votre voyage :
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { icon: Luggage, label: "Valise intelligente" },
                { icon: Wallet, label: "Guide budget" },
                { icon: FileText, label: "Guide visa & démarches" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground font-medium"
                >
                  <item.icon className="w-4 h-4 text-primary" />
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
          <strong className="text-foreground">Programme Early Explorer</strong> — Rejoignez la communauté de bêta-testeurs
        </span>
      </motion.div>
    </section>
  );
};

export default HeroSection;
