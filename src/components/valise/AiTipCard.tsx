import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lightbulb } from "lucide-react";
import type { LuggageMode } from "./LuggageModes";

interface AiTipCardProps {
  mode: LuggageMode;
  isLoading?: boolean;
}

const tips: Record<LuggageMode, { title: string; tip: string; emoji: string }> = {
  minimaliste: {
    title: "Conseil Minimaliste",
    tip: "Privilégie des vêtements polyvalents et neutres que tu peux combiner facilement. Roule tes vêtements pour gagner de la place.",
    emoji: "🎒",
  },
  confort: {
    title: "Conseil Confort",
    tip: "Un bon oreiller de voyage et un masque de sommeil feront toute la différence sur les longs trajets. Pense aux chaussettes de compression.",
    emoji: "✨",
  },
  stylée: {
    title: "Conseil Style",
    tip: "Emporte une paire de chaussures élégantes qui va avec tout. Privilégie des matières infroissables pour rester impeccable.",
    emoji: "👗",
  },
  aventure: {
    title: "Conseil Aventure",
    tip: "Prévois toujours une couche imperméable et un couteau suisse. La lampe frontale est indispensable, même en ville.",
    emoji: "🧭",
  },
  business: {
    title: "Conseil Business",
    tip: "N'oublie pas ton adaptateur universel et un chargeur de secours. Garde une copie numérique de tous tes documents importants.",
    emoji: "💼",
  },
  photo: {
    title: "Conseil Créateur",
    tip: "Protège ton matériel avec des housses rembourrées. Prévois des batteries supplémentaires et des cartes mémoire de secours.",
    emoji: "📸",
  },
  randonnée: {
    title: "Conseil Randonnée",
    tip: "Tes chaussures doivent être rodées avant le voyage. Prévois un filtre à eau et une couverture de survie pour les imprévus.",
    emoji: "🥾",
  },
  plage: {
    title: "Conseil Plage",
    tip: "La crème solaire SPF 50 est un must ! Prends un sac étanche pour protéger ton téléphone et tes clés près de l'eau.",
    emoji: "🏖️",
  },
  roadtrip: {
    title: "Conseil Road Trip",
    tip: "Prévois une glacière portable pour les snacks et boissons. Un kit premier secours auto est obligatoire dans plusieurs pays.",
    emoji: "🚗",
  },
  urbain: {
    title: "Conseil Urbain",
    tip: "Mise sur des sneakers stylées et confortables, une veste polyvalente et un petit sac à bandoulière anti-vol pour explorer la ville sereinement.",
    emoji: "🏙️",
  },
  luxe: {
    title: "Conseil Luxe",
    tip: "Privilégie une valise rigide premium, des matières nobles infroissables, et une trousse de toilette en cuir. Garde toujours une tenue de soirée prête.",
    emoji: "💎",
  },
};

const AiTipCard = ({ mode, isLoading }: AiTipCardProps) => {
  const data = tips[mode];

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-foreground">L'IA de Xplania analyse et adapte votre liste…</p>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl p-5 flex items-start gap-4 shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 text-xl">
            {data.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">{data.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.tip}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiTipCard;
