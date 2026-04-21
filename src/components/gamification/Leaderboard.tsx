import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Trophy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getLevelProgress } from "@/lib/xp-levels";

interface LbRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  badges: number;
  visited: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LbRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("leaderboard-xp");
        if (cancelled) return;
        if (error) throw error;
        setRows((data?.leaderboard as LbRow[]) || []);
      } catch (e) {
        console.error("[Leaderboard]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const top = rows.slice(0, 3);
  const rest = rows.slice(3, 10);
  const myRank = user ? rows.findIndex((r) => r.user_id === user.id) : -1;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground leading-tight">Leaderboard global</h2>
          <p className="text-xs text-muted-foreground">Top voyageurs Xplania (XP cumulés)</p>
        </div>
        {myRank >= 0 && (
          <span className="text-xs font-bold border border-primary/40 text-primary rounded-full px-2.5 py-1 whitespace-nowrap">
            Ton rang : #{myRank + 1}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Pas encore de classement. Sois le premier à débloquer des badges ! ✨
        </p>
      ) : (
        <>
          {/* Podium */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            {[1, 0, 2].map((podiumIdx) => {
              const r = top[podiumIdx];
              if (!r) return <div key={podiumIdx} />;
              const isFirst = podiumIdx === 0;
              const lvl = getLevelProgress(r.xp).level;
              const isMe = r.user_id === user?.id;
              return (
                <motion.div
                  key={r.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: podiumIdx * 0.1 }}
                  className={cn(
                    "rounded-2xl border p-3 text-center bg-card relative",
                    isFirst ? "border-amber-500/50 sm:-mt-3" : "border-border",
                    isMe && "ring-2 ring-primary",
                  )}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {podiumIdx === 0 && <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />}
                    {podiumIdx === 1 && <Medal className="w-5 h-5 text-slate-300" />}
                    {podiumIdx === 2 && <Medal className="w-5 h-5 text-orange-400" />}
                  </div>
                  <div className={cn(
                    "mx-auto mt-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-xl sm:text-2xl",
                    lvl.gradient,
                  )}>
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span aria-hidden>{lvl.emoji}</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-bold text-foreground truncate">
                    {r.display_name || "Voyageur"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{lvl.name}</p>
                  <p className="mt-1 text-sm font-bold text-amber-400 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {r.xp.toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Rest of top 10 */}
          {rest.length > 0 && (
            <div className="space-y-1.5">
              {rest.map((r, i) => {
                const lvl = getLevelProgress(r.xp).level;
                const isMe = r.user_id === user?.id;
                return (
                  <div
                    key={r.user_id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 border",
                      isMe ? "border-primary/40 bg-primary/5" : "border-border bg-card/40",
                    )}
                  >
                    <span className="text-xs font-bold text-muted-foreground w-6 tabular-nums">#{i + 4}</span>
                    <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-sm shrink-0", lvl.gradient)}>
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span aria-hidden>{lvl.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {r.display_name || "Voyageur"} {isMe && <span className="text-[10px] text-primary">(toi)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{lvl.name}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-400 tabular-nums">
                      {r.xp.toLocaleString()} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Leaderboard;
