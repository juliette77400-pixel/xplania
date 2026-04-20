import { Trophy } from "lucide-react";
import { MOOD_BADGES } from "@/lib/mood-badges";
import type { MoodBadge } from "@/hooks/useMoodBadges";
import { cn } from "@/lib/utils";

interface Props {
  badges: MoodBadge[];
}

const MoodBadgesPanel = ({ badges }: Props) => {
  const owned = new Set(badges.map((b) => b.code));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-sm">Badges Mood ({badges.length}/{MOOD_BADGES.length})</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MOOD_BADGES.map((b) => {
          const unlocked = owned.has(b.code);
          return (
            <div
              key={b.code}
              className={cn(
                "rounded-xl border p-3 text-center transition-all",
                unlocked
                  ? "border-primary/40 bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
                  : "border-border bg-card/40 opacity-50 grayscale",
              )}
            >
              <div className="text-3xl mb-1">{b.icon}</div>
              <div className="text-xs font-semibold">{b.name}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{b.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoodBadgesPanel;
