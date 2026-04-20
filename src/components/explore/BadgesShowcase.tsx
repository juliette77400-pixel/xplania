import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { EXPLORE_BADGES } from "@/lib/explore-badges";
import type { ExploreBadge } from "@/hooks/useExplore";

interface Props {
  badges: ExploreBadge[];
}

const BadgesShowcase = ({ badges }: Props) => {
  const unlocked = new Set(badges.map((b) => b.code));

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Badges</h3>
        <span className="text-xs text-muted-foreground ml-auto">{unlocked.size}/{EXPLORE_BADGES.length}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {EXPLORE_BADGES.map((b) => {
          const isUnlocked = unlocked.has(b.code);
          return (
            <motion.div
              key={b.code}
              initial={isUnlocked ? { scale: 0.5, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition ${
                isUnlocked
                  ? "bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                  : "bg-muted/10 border border-border opacity-40"
              }`}
              title={b.description}
            >
              <span className="text-2xl mb-1">{b.icon}</span>
              <span className="text-[10px] text-center text-foreground font-semibold leading-tight">{b.name}</span>
              {isUnlocked && (
                <motion.span
                  className="absolute inset-0 rounded-xl"
                  initial={{ boxShadow: "0 0 0 0 hsl(var(--primary) / 0.6)" }}
                  animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.6)", "0 0 0 10px hsl(var(--primary) / 0)"] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesShowcase;
