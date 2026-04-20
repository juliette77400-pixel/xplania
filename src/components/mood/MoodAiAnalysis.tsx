import { motion } from "framer-motion";
import { Sparkles, Zap, Compass, Users, Moon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { moodByKey } from "@/lib/moods";

interface Props {
  mood: string | null;
  energyLevel?: number | null;
  placesCount: number;
}

/**
 * Figma-inspired "Analyse IA" panel — 4 dynamic gauges + summary.
 * Computes scores from active mood + energy slider for an immersive feel.
 */
const MoodAiAnalysis = ({ mood, energyLevel, placesCount }: Props) => {
  if (!mood) return null;
  const m = moodByKey(mood);
  const energy = energyLevel ?? 50;

  // Mood → exploration / social / rest mapping
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
    { label: "Énergie du moment", value: energy, icon: Zap, color: "from-yellow-500 to-orange-500", level: energy > 66 ? "Niveau élevé" : energy > 33 ? "Équilibré" : "Calme" },
    { label: "Besoin d'exploration", value: exploration, icon: Compass, color: "from-cyan-500 to-blue-500", level: exploration > 70 ? "Très motivé(e)" : "Modéré" },
    { label: "Ouverture sociale", value: social, icon: Users, color: "from-purple-500 to-pink-500", level: social > 70 ? "Très ouvert(e)" : social > 40 ? "Équilibré" : "Introspectif" },
    { label: "Besoin de repos", value: rest, icon: Moon, color: "from-indigo-500 to-purple-500", level: rest > 60 ? "Important" : rest > 30 ? "Modéré" : "Minimal" },
  ];

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
          <h3 className="font-bold text-sm">Analyse IA en temps réel</h3>
          <p className="text-xs text-muted-foreground">Ce que l'IA détecte de ton état</p>
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
            ✨ Résumé IA
          </div>
          <p className="text-sm leading-relaxed">
            Ton mood <span className="font-semibold">{m.label.toLowerCase()}</span> combiné à une énergie {energy > 60 ? "élevée" : energy > 30 ? "équilibrée" : "calme"} suggère que tu apprécierais des expériences {exploration > 70 ? "stimulantes et immersives" : "douces et contemplatives"}. L'IA a sélectionné <span className="font-bold text-primary">{placesCount} lieux</span> qui matchent ton état actuel.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MoodAiAnalysis;
