import { motion } from "framer-motion";
import { Sparkles, Wallet, TrendingUp, CreditCard } from "lucide-react";

interface BudgetHeroProps {
  onGenerate: () => void;
  isGenerating: boolean;
  hasGenerated: boolean;
}

const floatingIcons = [
  { icon: CreditCard, className: "absolute top-12 left-[15%] text-primary", size: 40, delay: 0 },
  { icon: Wallet, className: "absolute top-8 right-[18%] text-yellow-400", size: 36, delay: 0.5 },
  { icon: TrendingUp, className: "absolute bottom-16 right-[25%] text-secondary", size: 32, delay: 1 },
];

const BudgetHero = ({ onGenerate, isGenerating, hasGenerated }: BudgetHeroProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative text-center py-16 overflow-hidden"
    >
      {/* Floating icons */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          className={item.className}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1, y: [0, -12, 0] }}
          transition={{
            delay: item.delay,
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <item.icon size={item.size} />
        </motion.div>
      ))}

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground mb-6"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        Propulsé par IA Xplania
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-6xl font-extrabold mb-4"
      >
        <span className="gradient-text">Budget Intelligent</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto"
      >
        Planifie, suis et optimise tes dépenses grâce à l'IA Xplania.
      </motion.p>

      {/* CTA */}
      {!hasGenerated && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-background shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-shadow disabled:opacity-60"
        >
          {isGenerating ? "Analyse en cours…" : "Créer mon budget prévisionnel"}
        </motion.button>
      )}
    </motion.div>
  );
};

export default BudgetHero;
