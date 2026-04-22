// ✨ NEW (Tâche 3) — Carte streak quotidien sur le Dashboard.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getStreakDisplay, type StreakState } from "@/lib/streak";

const StreakCard = () => {
  const { t } = useTranslation();
  const [s, setS] = useState<StreakState>(() => getStreakDisplay());

  useEffect(() => {
    setS(getStreakDisplay());
  }, []);

  const motivational =
    s.streak === 0
      ? t("streakCard.msg0")
      : s.streak < 3
      ? t("streakCard.msg1")
      : s.streak < 7
      ? t("streakCard.msg3")
      : s.streak < 30
      ? t("streakCard.msg7")
      : t("streakCard.msg30");

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-500/10 via-card to-amber-500/10 border-amber-500/20">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold gradient-text leading-none">{s.streak}</p>
            <span className="text-xs text-muted-foreground">{s.streak > 1 ? t("streakCard.daysInARow") : t("streakCard.day")}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{motivational}</p>
        </div>
        {s.best > s.streak && (
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-amber-500">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{s.best}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("streakCard.record")}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StreakCard;
