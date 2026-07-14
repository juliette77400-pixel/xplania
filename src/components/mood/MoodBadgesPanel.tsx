import { useEffect, useMemo, useRef } from "react";
import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MOOD_BADGES, type BadgeContext } from "@/lib/mood-badges";
import type { MoodBadge } from "@/hooks/useMoodBadges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { celebrateUnlock } from "@/lib/badges-fx";

interface Props {
  badges: MoodBadge[];
  context?: BadgeContext;
}

const SEEN_MOOD_KEY = "xplania_seen_mood_badges_v1";
const loadSeen = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(SEEN_MOOD_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
};
const saveSeen = (s: Set<string>) => {
  try { sessionStorage.setItem(SEEN_MOOD_KEY, JSON.stringify([...s])); } catch { /* noop */ }
};

const MoodBadgesPanel = ({ badges, context }: Props) => {
  const { t } = useTranslation();

  function badgeProgress(code: string, ctx?: BadgeContext): { current: number; target: number; label: string } {
    if (!ctx) return { current: 0, target: 1, label: "" };
    switch (code) {
      case "mood_curious":
        return { current: Math.min(ctx.distinctMoods, 3), target: 3, label: t("moodComp.badges.moodsTested", { current: Math.min(ctx.distinctMoods, 3), target: 3 }) };
      case "mood_master":
        return { current: Math.min(ctx.distinctMoods, 7), target: 7, label: t("moodComp.badges.moodsTested", { current: Math.min(ctx.distinctMoods, 7), target: 7 }) };
      case "hidden_hunter":
        return { current: Math.min(ctx.hiddenGemsSaved, 1), target: 1, label: t("moodComp.badges.hiddenGemSaved", { current: ctx.hiddenGemsSaved, target: 1 }) };
      case "collector":
        return { current: Math.min(ctx.favoritesCount, 10), target: 10, label: t("moodComp.badges.favs", { current: ctx.favoritesCount, target: 10 }) };
      case "social_soul":
        return { current: Math.min(ctx.reactionsCount, 1), target: 1, label: t("moodComp.badges.shared", { current: ctx.reactionsCount, target: 1 }) };
      default:
        return { current: 0, target: 1, label: "" };
    }
  }

  const owned = useMemo(() => new Set(badges.map((b) => b.code)), [badges]);
  const unlockedCount = badges.length;
  const total = MOOD_BADGES.length;
  const globalPct = Math.round((unlockedCount / total) * 100);
  const seenBadges = useRef<Set<string>>(loadSeen());
  const hydratedRef = useRef(false);

  useEffect(() => {
    const codes = [...owned];
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      const merged = new Set([...seenBadges.current, ...codes]);
      seenBadges.current = merged;
      saveSeen(merged);
      return;
    }
    let changed = false;
    for (const code of codes) {
      if (!seenBadges.current.has(code)) {
        const def = MOOD_BADGES.find((b) => b.code === code);
        if (def) celebrateUnlock({ name: def.name, icon: def.icon, description: def.description });
        seenBadges.current.add(code);
        changed = true;
      }
    }
    if (changed) saveSeen(seenBadges.current);
  }, [owned]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">{t("moodComp.badges.title")}</h3>
            </div>
            <span className="text-xs text-muted-foreground">{unlockedCount}/{total}</span>
          </div>
          <Progress value={globalPct} className="h-1.5" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MOOD_BADGES.map((b) => {
            const unlocked = owned.has(b.code);
            const prog = badgeProgress(b.code, context);
            const pct = prog.target > 0 ? Math.round((prog.current / prog.target) * 100) : 0;
            return (
              <Tooltip key={b.code}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "relative rounded-xl border p-3 text-center transition-all cursor-help",
                      unlocked
                        ? "border-primary/40 bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:scale-105"
                        : "border-border bg-card/40 hover:border-border/80",
                    )}
                  >
                    <div className={cn("text-3xl mb-1 transition-all", !unlocked && "grayscale opacity-50")}>{b.icon}</div>
                    <div className={cn("text-xs font-semibold", !unlocked && "text-muted-foreground")}>{b.name}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{b.description}</div>
                    {unlocked ? (
                      <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-primary fill-primary/20" />
                    ) : (
                      <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-muted-foreground/60" />
                    )}
                    {!unlocked && context && (
                      <div className="mt-2">
                        <Progress value={pct} className="h-1" />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px]">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="text-base">{b.icon}</span> {b.name}
                    </div>
                    <p className="text-xs text-muted-foreground">{b.description}</p>
                    {unlocked ? (
                      <p className="text-xs text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t("moodComp.badges.unlocked")}</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium">{t("moodComp.badges.howToUnlock")}</p>
                        <p className="text-xs">{prog.label || b.description}</p>
                        {context && (
                          <Progress value={pct} className="h-1 mt-1" />
                        )}
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

export default MoodBadgesPanel;
