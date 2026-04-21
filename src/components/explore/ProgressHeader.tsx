import { motion } from "framer-motion";
import { Trophy, MapPin, Sparkles, Flag } from "lucide-react";
import type { ExploreProgress } from "@/hooks/useExplore";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface Props {
  progress: ExploreProgress | null;
  cityName?: string;
}

const ProgressHeader = ({ progress, cityName }: Props) => {
  const { t } = useTranslation();
  const total = progress?.nodes_total || 0;
  const visited = progress?.nodes_visited || 0;
  const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
  const points = progress?.total_points || 0;

  const stats = [
    { label: t("x2.stPoints"), value: points, icon: Sparkles, color: "text-amber-400" },
    { label: t("x2.stVisited"), value: `${visited}/${total}`, icon: MapPin, color: "text-emerald-400" },
    { label: t("x2.stCities"), value: progress?.cities_completed || 0, icon: Flag, color: "text-cyan-400" },
    { label: t("x2.stBadges"), value: progress?.badges_count || 0, icon: Trophy, color: "text-purple-400" },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary">{t("x2.tmKicker")}</p>
          <h2 className="text-xl font-bold text-foreground">{cityName || t("x2.myGameTrip")}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-bold text-foreground text-lg">{pct}%</span>
          <span>{t("x2.explored")}</span>
        </div>
      </div>

      <Progress value={pct} className="h-2" />

      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-muted/20 p-3 flex flex-col items-center gap-1"
          >
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <span className="text-lg font-bold text-foreground">{s.value}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProgressHeader;
