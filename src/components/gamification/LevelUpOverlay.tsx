import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles, X } from "lucide-react";
import type { Level } from "@/lib/xp-levels";
import { cn } from "@/lib/utils";

interface Props {
  level: Level | null;
  onClose: () => void;
}

const LevelUpOverlay = ({ level, onClose }: Props) => {
  useEffect(() => {
    if (!level) return;
    // Triple-burst confetti for full screen "wow" effect
    const fire = (x: number, angle: number) => {
      try {
        confetti({
          particleCount: 90,
          spread: 100,
          ticks: 120,
          origin: { x, y: 0.6 },
          angle,
          colors: ["#fbbf24", "#a78bfa", "#22d3ee", "#f472b6", "#34d399"],
          scalar: 1.1,
        });
      } catch { /* noop */ }
    };
    fire(0.1, 60);
    fire(0.9, 120);
    setTimeout(() => fire(0.5, 90), 250);
    setTimeout(() => {
      try {
        confetti({
          particleCount: 150,
          spread: 160,
          origin: { x: 0.5, y: 0.4 },
          startVelocity: 45,
          colors: ["#fbbf24", "#a78bfa", "#22d3ee"],
        });
      } catch { /* noop */ }
    }, 500);

    // Auto-close after 6s
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [level, onClose]);

  return (
    <AnimatePresence>
      {level && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/85 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-card/80 hover:bg-card border border-border"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          <motion.div
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full text-center"
          >
            {/* Glowing aura */}
            <motion.div
              aria-hidden
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className={cn(
                "absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br blur-3xl",
                level.gradient,
              )}
            />

            <motion.div
              animate={{ rotate: [0, -6, 6, -3, 3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
              className={cn(
                "mx-auto w-32 h-32 rounded-3xl bg-gradient-to-br flex items-center justify-center text-7xl shadow-2xl",
                level.gradient,
              )}
            >
              <span aria-hidden>{level.emoji}</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-amber-400"
            >
              <Sparkles className="w-3.5 h-3.5" /> Niveau supérieur
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-4xl sm:text-5xl font-extrabold text-foreground"
            >
              {level.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 text-sm text-muted-foreground"
            >
              Tu viens de franchir un palier 🎉<br />
              Continue d'explorer pour atteindre le suivant.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={onClose}
              className={cn(
                "mt-6 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r shadow-lg hover:opacity-90 transition-opacity",
                level.gradient,
              )}
            >
              Continuer l'aventure ✨
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpOverlay;
