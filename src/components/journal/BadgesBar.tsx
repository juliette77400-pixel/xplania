import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BADGES } from "@/lib/journal-utils";
import type { JournalDay } from "@/hooks/useJournal";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { celebrateUnlock, adaptToTripDuration } from "@/lib/badges-fx";

interface Props {
  journalId: string;
  days: JournalDay[];
  /** Optional trip duration in days — adapts targets so short trips can still unlock */
  tripDurationDays?: number | null;
}

const BadgesBar = ({ journalId, days, tripDurationDays }: Props) => {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  // Load already-unlocked badges
  useEffect(() => {
    if (!user) return;
    supabase
      .from("journal_badges")
      .select("code")
      .eq("user_id", user.id)
      .eq("journal_id", journalId)
      .then(({ data }) => {
        setUnlocked((data || []).map((b: any) => b.code));
      });
  }, [user, journalId]);

  // Compute counts and per-badge progress (adapted to trip duration)
  const { counts, definitions } = useMemo(() => {
    const c = { note: 0, photo: 0, location: 0, mood: 0, highlight: 0 } as Record<string, number>;
    for (const d of days) for (const b of d.blocks) c[b.type] = (c[b.type] || 0) + 1;
    const defs = [
      { code: "explorer", label: BADGES.explorer.label, current: c.location, baseTarget: 3, kind: "lieux visités" },
      { code: "storyteller", label: BADGES.storyteller.label, current: c.note, baseTarget: 5, kind: "notes écrites" },
      { code: "photographer", label: BADGES.photographer.label, current: c.photo, baseTarget: 10, kind: "photos ajoutées" },
      { code: "emotional", label: BADGES.emotional.label, current: c.mood, baseTarget: 5, kind: "humeurs partagées" },
      { code: "highlight", label: BADGES.highlight.label, current: c.highlight, baseTarget: 3, kind: "moments forts" },
    ].map((d) => {
      const target = adaptToTripDuration(d.baseTarget, tripDurationDays);
      return { ...d, target, ok: d.current >= target, pct: Math.min(100, Math.round((d.current / target) * 100)) };
    });
    return { counts: c, definitions: defs };
  }, [days, tripDurationDays]);

  // Detect unlocks → persist + celebrate
  useEffect(() => {
    if (!user) return;
    for (const def of definitions) {
      if (def.ok && !unlocked.includes(def.code)) {
        supabase
          .from("journal_badges")
          .insert({ user_id: user.id, journal_id: journalId, code: def.code, label: def.label })
          .then(({ error }) => {
            if (!error) {
              setUnlocked((u) => [...u, def.code]);
              setJustUnlocked(def.code);
              celebrateUnlock({
                name: def.label,
                description: `${def.current}/${def.target} ${def.kind} ✓`,
              });
              setTimeout(() => setJustUnlocked(null), 2500);
            }
          });
      }
    }
  }, [definitions, user, journalId, unlocked]);

  const unlockedCount = unlocked.length;
  const totalCount = definitions.length;
  const globalPct = Math.round((unlockedCount / totalCount) * 100);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Badges</h3>
          <span className="text-xs text-muted-foreground">({unlockedCount}/{totalCount})</span>
          <div className="flex-1" />
          {tripDurationDays != null && (
            <span className="text-[10px] text-muted-foreground">
              Adapté à un voyage de {tripDurationDays}j
            </span>
          )}
        </div>
        <Progress value={globalPct} className="h-1.5" />

        <div className="space-y-2.5">
          {definitions.map((def) => {
            const isUnlocked = unlocked.includes(def.code);
            const isJust = justUnlocked === def.code;
            return (
              <Tooltip key={def.code}>
                <TooltipTrigger asChild>
                  <motion.div
                    layout
                    className={cn(
                      "relative rounded-xl border p-2.5 flex items-center gap-3 transition-colors cursor-help overflow-hidden",
                      isUnlocked
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-card/40"
                    )}
                  >
                    {/* Unlock burst overlay */}
                    <AnimatePresence>
                      {isJust && (
                        <motion.span
                          className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-r from-amber-400/40 via-fuchsia-400/30 to-cyan-400/40"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.05, 1.2] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.6 }}
                        />
                      )}
                    </AnimatePresence>

                    <motion.span
                      className={cn(
                        "text-xl shrink-0 relative z-10",
                        !isUnlocked && "grayscale opacity-60"
                      )}
                      animate={isJust ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : {}}
                      transition={{ duration: 0.8 }}
                    >
                      {def.label.split(" ")[0]}
                    </motion.span>

                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-xs font-semibold truncate",
                            isUnlocked ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {def.label.replace(/^[\p{Emoji}\s]+/u, "")}
                        </p>
                        {isUnlocked ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={def.pct}
                          className={cn("h-1 flex-1", isUnlocked && "[&>div]:bg-emerald-400")}
                        />
                        <span
                          className={cn(
                            "text-[10px] font-semibold tabular-nums shrink-0",
                            isUnlocked ? "text-emerald-400" : "text-muted-foreground"
                          )}
                        >
                          {def.current}/{def.target}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px]">
                  <p className="text-xs font-semibold">{def.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isUnlocked
                      ? "Débloqué — bravo !"
                      : `Plus que ${Math.max(0, def.target - def.current)} ${def.kind} pour le débloquer.`}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BadgesBar;
