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
}

const modes: { id: LuggageMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "minimaliste", label: "Minimaliste", icon: <PackageOpen className="w-5 h-5" />, desc: "L'essentiel uniquement" },
  { id: "confort", label: "Confort", icon: <Sparkles className="w-5 h-5" />, desc: "Confort au quotidien" },
  { id: "stylée", label: "Stylée", icon: <Shirt className="w-5 h-5" />, desc: "Look soigné" },
  { id: "aventure", label: "Aventure", icon: <Compass className="w-5 h-5" />, desc: "Tout-terrain" },
  { id: "business", label: "Business", icon: <Briefcase className="w-5 h-5" />, desc: "Pro & élégant" },
  { id: "photo", label: "Créateur", icon: <Camera className="w-5 h-5" />, desc: "Matériel créatif" },
  { id: "randonnée", label: "Randonnée", icon: <Mountain className="w-5 h-5" />, desc: "Trek & nature" },
  { id: "plage", label: "Plage", icon: <Umbrella className="w-5 h-5" />, desc: "Soleil & sable" },
  { id: "roadtrip", label: "Road Trip", icon: <Car className="w-5 h-5" />, desc: "Route & liberté" },
];

const LuggageModes = ({ activeMode, onSelect, suggestedMode }: LuggageModesProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.18 }}
    className="glass-card rounded-2xl p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Choisis ton mode de valise
      </h3>
      {suggestedMode && (
        <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
          Suggestion IA : {modes.find((m) => m.id === suggestedMode)?.label}
        </span>
      )}
    </div>
    <p className="text-xs text-muted-foreground mb-4">Sélectionne le style qui correspond à ton voyage</p>
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        const isSuggested = suggestedMode === mode.id && !isActive;
        return (
          <motion.button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.25 }}
            className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl transition-all text-center border ${
              isActive
                ? "bg-primary/15 border-primary/40 text-primary shadow-[var(--glow-cyan)]"
                : isSuggested
                ? "bg-primary/5 border-primary/20 text-primary/70"
                : "bg-muted/20 border-transparent hover:bg-muted/40 text-muted-foreground"
            }`}
          >
            {isSuggested && (
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary animate-pulse" />
            )}
            <div className={`transition-transform ${isActive ? "scale-110" : ""}`}>
              {mode.icon}
            </div>
            <p className="text-xs font-semibold leading-tight">{mode.label}</p>
            <p className="text-[9px] opacity-60 hidden sm:block leading-tight">{mode.desc}</p>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

export { modes };
export default LuggageModes;
