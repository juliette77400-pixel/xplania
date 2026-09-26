import i18n from "@/i18n";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelProgress, LEVELS, levelName } from "@/lib/xp-levels";
import { useTranslation } from "react-i18next";

interface Props {
  xp: number;
}

const XpHeader = ({ xp }: Props) => {
  const { t, i18n } = useTranslation();
  const { level, next, xpInLevel, xpForNext, pct } = getLevelProgress(xp);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Level medallion */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220 }}
          className={cn(
            "shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl sm:text-4xl shadow-lg",
            level.gradient,
          )}
        >
          <span aria-hidden>{level.emoji}</span>
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs sm:text-xs uppercase tracking-wider text-primary font-semibold">
              {t("gam.levelOf", { n: level.index + 1, total: LEVELS.length })}
            </p>
            <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1 text-xs sm:text-xs font-bold text-amber-400">
              <Sparkles className="w-3 h-3" /> {xp.toLocaleString()} XP
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-tight truncate">
            {levelName(level, i18n.language)}
          </h2>

          {next ? (
            <>
              <div className="mt-2 h-2.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn("h-full rounded-full bg-gradient-to-r", level.gradient)}
                />
              </div>
              <p className="text-xs sm:text-xs text-muted-foreground mt-1.5">
                <span className="font-bold text-foreground tabular-nums">{xpForNext.toLocaleString()} XP</span>{" "}
                {i18n.language?.startsWith("en") ? "to reach" : "pour passer"}{" "}
                <span className="font-semibold text-foreground">
                  {next.emoji} {levelName(next, i18n.language)}
                </span>
              </p>
            </>
          ) : (
            <p className="text-xs text-amber-400 font-semibold mt-2">
              {i18n.t("ui2.auto2.m11")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default XpHeader;
