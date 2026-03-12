import { motion } from "framer-motion";
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

const Footer = ({ onFeedback, onCreateTrip }: Props) => {
  return (
    <footer className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(230 50% 4%) 50%, hsl(240 40% 2%) 100%)" }}>
      {/* Stars */}
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
        {/* 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Column 1 — Xplania */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Xplania</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Votre copilote de voyage intelligent. Planifiez, préparez et vivez vos voyages grâce à l'intelligence artificielle. Xplania centralise budget, documents et bagages pour voyager l'esprit léger.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-primary border border-primary/30 bg-primary/5 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              Version 0.1 • Bêta Privée
            </span>
          </motion.div>

          {/* Column 2 — Fonctionnalités */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">Fonctionnalités</h4>
            <ul className="space-y-3">
              {[
                { icon: Luggage, label: "Valise intelligente" },
                { icon: Wallet, label: "Guide budget" },
                { icon: FileText, label: "Guide visa & démarches" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href="#features"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <item.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3 — Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">Contact bêta Xplania</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={onFeedback}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <MessageSquare className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Donner mon feedback
                </button>
              </li>
              <li>
                <button
                  onClick={onCreateTrip}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Sparkles className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Tester les fonctionnalités
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

        {/* Separator */}
        <div className="my-10 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsla(210, 40%, 96%, 0.1), hsla(185, 85%, 55%, 0.15), hsla(210, 40%, 96%, 0.1), transparent)" }} />

        {/* Beta badge center */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-3 mb-10"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold text-secondary-foreground" style={{ background: "linear-gradient(135deg, hsla(270, 70%, 55%, 0.3), hsla(270, 70%, 55%, 0.15))", border: "1px solid hsla(270, 70%, 55%, 0.3)" }}>
            <Star className="w-3.5 h-3.5" />
            Bêta privée en cours
          </span>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Xplania est actuellement testé par les premiers voyageurs afin d'améliorer l'expérience.
          </p>
        </motion.div>

        {/* Bottom */}
        <div className="text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Xplania – Prototype bêta v0.1
          </p>
          <p className="text-xs text-muted-foreground/60">
            © 2026 Xplania – Programme bêta exclusif – Construit avec ❤️ pour les voyageurs
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
