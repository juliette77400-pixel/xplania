import { motion } from "framer-motion";
import { Sparkles, Zap, Compass, Users, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { moodByKey } from "@/lib/moods";

interface Props {
  mood: string | null;
  energyLevel?: number | null;
  placesCount: number;
}

const MoodAiAnalysis = ({ mood, energyLevel, placesCount }: Props) => {
  const { t } = useTranslation();
  if (!mood) return null;
  const m = moodByKey(mood);
  const energy = energyLevel ?? 50;

  const explorationMap: Record<string, number> = {
    adventurous: 95, curious: 88, energetic: 85, social: 70, creative: 75,
    discovery: 90, calm: 35, romantic: 50,
  };
  const socialMap: Record<string, number> = {
    social: 95, energetic: 75, romantic: 70, curious: 60, creative: 55,
    adventurous: 50, discovery: 45, calm: 25,
  };
  const restMap: Record<string, number> = {
    calm: 90, romantic: 65, creative: 45, curious: 35, discovery: 30,
    social: 25, adventurous: 15, energetic: 10,
  };

  const exploration = explorationMap[mood] ?? 60;
  const social = socialMap[mood] ?? 50;
  const rest = restMap[mood] ?? 40;

  const gauges = [
    { label: t("moodComp.ai.energy"), value: energy, icon: Zap, color: "from-yellow-500 to-orange-500", level: energy > 66 ? t("moodComp.ai.lvlHigh") : energy > 33 ? t("moodComp.ai.lvlBalanced") : t("moodComp.ai.lvlCalm") },
    { label: t("moodComp.ai.exploration"), value: exploration, icon: Compass, color: "from-cyan-500 to-blue-500", level: exploration > 70 ? t("moodComp.ai.lvlMotivated") : t("moodComp.ai.lvlModerate") },
    { label: t("moodComp.ai.social"), value: social, icon: Users, color: "from-purple-500 to-pink-500", level: social > 70 ? t("moodComp.ai.lvlOpen") : social > 40 ? t("moodComp.ai.lvlBalanced") : t("moodComp.ai.lvlIntrospective") },
    { label: t("moodComp.ai.rest"), value: rest, icon: Moon, color: "from-indigo-500 to-purple-500", level: rest > 60 ? t("moodComp.ai.lvlImportant") : rest > 30 ? t("moodComp.ai.lvlModerate") : t("moodComp.ai.lvlMinimal") },
  ];

  const moodLabel = m ? t(`moodComp.moods.${m.key}.label`, { defaultValue: m.label }).toLowerCase() : "";
  const energyWord = energy > 60 ? t("moodComp.ai.energyHigh") : energy > 30 ? t("moodComp.ai.energyBalancedW") : t("moodComp.ai.energyCalmW");
  const kindWord = exploration > 70 ? t("moodComp.ai.kindStimulating") : t("moodComp.ai.kindGentle");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/40 to-accent/5 backdrop-blur-sm p-5 md:p-6 space-y-5"
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-accent">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-bold text-sm">{t("moodComp.ai.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("moodComp.ai.subtitle")}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {gauges.map((g, i) => (
          <motion.div
            key={g.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <g.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium truncate">{g.label}</span>
              </div>
              <span className="text-xs font-bold tabular-nums">{Math.round(g.value)}%</span>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${g.value}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${g.color} rounded-full`}
              />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{g.level}</p>
          </motion.div>
        ))}
      </div>

      {placesCount > 0 && m && (
        <div className="pt-4 border-t border-border/50 space-y-2">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary font-semibold">
            {t("moodComp.ai.summaryTitle")}
          </div>
          <p className="text-sm leading-relaxed">
            {t("moodComp.ai.summaryText", { mood: moodLabel, energy: energyWord, kind: kindWord, count: placesCount })}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MoodAiAnalysis;
