import { motion } from "framer-motion";
import {
  Briefcase, Camera, Mountain, Umbrella, Car, Sparkles,
  PackageOpen, Compass, Shirt
} from "lucide-react";

export type LuggageMode =
  | "minimaliste" | "confort" | "stylée" | "aventure"
  | "business" | "photo" | "randonnée" | "plage" | "roadtrip";

interface LuggageModesProps {
  activeMode: LuggageMode;
  onSelect: (mode: LuggageMode) => void;
  suggestedMode?: LuggageMode | null;
  isLoading?: boolean;
}

const modes: { id: LuggageMode; label: string; icon: React.ReactNode; desc: string; emoji: string }[] = [
  { id: "minimaliste", label: "Minimaliste", icon: <PackageOpen className="w-4 h-4" />, desc: "L'essentiel uniquement", emoji: "🎒" },
  { id: "confort", label: "Confort", icon: <Sparkles className="w-4 h-4" />, desc: "Confort au quotidien", emoji: "✨" },
  { id: "stylée", label: "Stylée", icon: <Shirt className="w-4 h-4" />, desc: "Look soigné", emoji: "👗" },
  { id: "aventure", label: "Aventure", icon: <Compass className="w-4 h-4" />, desc: "Tout-terrain", emoji: "🧭" },
  { id: "business", label: "Business", icon: <Briefcase className="w-4 h-4" />, desc: "Pro & élégant", emoji: "💼" },
  { id: "photo", label: "Créateur", icon: <Camera className="w-4 h-4" />, desc: "Matériel créatif", emoji: "📸" },
  { id: "randonnée", label: "Randonnée", icon: <Mountain className="w-4 h-4" />, desc: "Trek & nature", emoji: "🥾" },
  { id: "plage", label: "Plage", icon: <Umbrella className="w-4 h-4" />, desc: "Soleil & sable", emoji: "🏖️" },
  { id: "roadtrip", label: "Road Trip", icon: <Car className="w-4 h-4" />, desc: "Route & liberté", emoji: "🚗" },
];

const LuggageModes = ({ activeMode, onSelect, suggestedMode, isLoading }: LuggageModesProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.18 }}
    className="space-y-4"
  >
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-bold text-foreground">Type de valise</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Sélectionne pour adapter le contenu instantanément</p>
      </div>
      {suggestedMode && (
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold animate-pulse">
          ✨ Suggestion IA : {modes.find((m) => m.id === suggestedMode)?.label}
        </span>
      )}
    </div>

    {/* Horizontal scrollable pills */}
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;
          const isSuggested = suggestedMode === mode.id && !isActive;
          return (
            <motion.button
              key={mode.id}
              onClick={() => !isLoading && onSelect(mode.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 border text-sm font-medium shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : isSuggested
                  ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              } ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isSuggested && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              )}
              <span className="text-base">{mode.emoji}</span>
              {mode.icon}
              <span>{mode.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activePillIndicator"
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      {/* Fade edges */}
      <div className="pointer-events-none absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent" />
    </div>
  </motion.div>
);

export { modes };
export default LuggageModes;
