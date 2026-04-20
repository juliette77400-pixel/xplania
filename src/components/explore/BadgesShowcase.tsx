import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { EXPLORE_BADGES, BADGE_CATEGORIES, RARITY_STYLES, type BadgeCategory } from "@/lib/explore-badges";
import type { ExploreBadge, ExploreNode } from "@/hooks/useExplore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { celebrateUnlock } from "@/lib/badges-fx";

interface Props {
  badges: ExploreBadge[];
  nodes: ExploreNode[];
  mediaCount: number;
}

const BadgesShowcase = ({ badges, nodes, mediaCount }: Props) => {
  const owned = useMemo(() => new Set(badges.map((b) => b.code)), [badges]);
  const [active, setActive] = useState<BadgeCategory | "all">("all");
  const prevOwned = useRef<Set<string>>(new Set());

  // Detect newly-unlocked badges → confetti
  useEffect(() => {
    if (prevOwned.current.size === 0 && owned.size > 0) {
      prevOwned.current = new Set(owned);
      return;
    }
    for (const code of owned) {
      if (!prevOwned.current.has(code)) {
        const def = EXPLORE_BADGES.find((b) => b.code === code);
        if (def) celebrateUnlock({ name: def.name, icon: def.icon, description: def.description });
      }
    }
    prevOwned.current = new Set(owned);
  }, [owned]);

  const filtered = active === "all" ? EXPLORE_BADGES : EXPLORE_BADGES.filter((b) => b.category === active);
  const unlockedCount = badges.length;
  const total = EXPLORE_BADGES.length;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Collection de badges</h3>
          <span className="text-xs text-muted-foreground ml-auto">{unlockedCount}/{total}</span>
        </div>
        <Progress value={Math.round((unlockedCount / total) * 100)} className="h-1.5" />

        {/* Category filter chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActive("all")}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              active === "all" ? "border-primary/60 bg-primary/15 text-foreground" : "border-border bg-card/40 text-muted-foreground hover:border-border/80",
            )}
          >
            Tous · {total}
          </button>
          {BADGE_CATEGORIES.map((cat) => {
            const count = EXPLORE_BADGES.filter((b) => b.category === cat.key).length;
            const got = badges.filter((b) => EXPLORE_BADGES.find((d) => d.code === b.code)?.category === cat.key).length;
            const isActive = active === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActive(cat.key)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5",
                  isActive ? "border-primary/60 bg-primary/15 text-foreground" : "border-border bg-card/40 text-muted-foreground hover:border-border/80",
                )}
              >
                <span>{cat.icon}</span> {cat.label}
                <span className="opacity-60">{got}/{count}</span>
              </button>
            );
          })}
        </div>

        {/* Mini collectible grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
          {filtered.map((b) => {
            const unlocked = owned.has(b.code);
            const prog = b.progress(nodes, mediaCount);
            const pct = prog.target > 0 ? Math.round((prog.current / prog.target) * 100) : 0;
            const r = RARITY_STYLES[b.rarity];

            return (
              <Tooltip key={b.code}>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.08, y: -2 }}
                    initial={unlocked ? { scale: 0.5, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220 }}
                    className={cn(
                      "relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 cursor-help transition-all",
                      "ring-1",
                      unlocked
                        ? cn("bg-gradient-to-br from-card via-card to-primary/15", r.ring, r.glow)
                        : "bg-muted/10 ring-border/50 opacity-60 grayscale",
                    )}
                  >
                    <div className="text-2xl leading-none">{b.icon}</div>
                    <div className={cn("text-[8px] font-bold uppercase tracking-wide mt-1", unlocked ? r.label : "text-muted-foreground")}>
                      {b.rarity}
                    </div>
                    {unlocked ? (
                      <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-emerald-400 fill-emerald-500/30" />
                    ) : (
                      <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-muted-foreground/60" />
                    )}
                    {unlocked && (
                      <motion.span
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        initial={{ boxShadow: "0 0 0 0 hsl(var(--primary) / 0.6)" }}
                        animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.5)", "0 0 0 8px hsl(var(--primary) / 0)"] }}
                        transition={{ repeat: Infinity, duration: 2.4 }}
                      />
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px]">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-lg">{b.icon}</span>
                      <span>{b.name}</span>
                      <span className={cn("text-[10px] uppercase font-bold", r.label)}>· {b.rarity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{b.description}</p>
                    {unlocked ? (
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Débloqué
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium">Progression</span>
                          <span className="text-muted-foreground">{prog.current}/{prog.target}</span>
                        </div>
                        <Progress value={pct} className="h-1" />
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BadgesShowcase;
