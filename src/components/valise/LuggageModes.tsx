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
}

const modes: { id: LuggageMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "minimaliste", label: "Minimaliste", icon: <PackageOpen className="w-4 h-4" />, desc: "L'essentiel uniquement" },
  { id: "confort", label: "Confort", icon: <Sparkles className="w-4 h-4" />, desc: "Confort au quotidien" },
  { id: "stylée", label: "Stylée", icon: <Shirt className="w-4 h-4" />, desc: "Look soigné" },
  { id: "aventure", label: "Aventure", icon: <Compass className="w-4 h-4" />, desc: "Tout-terrain" },
  { id: "business", label: "Business", icon: <Briefcase className="w-4 h-4" />, desc: "Pro & élégant" },
  { id: "photo", label: "Créateur / Photo", icon: <Camera className="w-4 h-4" />, desc: "Matériel créatif" },
  { id: "randonnée", label: "Randonnée", icon: <Mountain className="w-4 h-4" />, desc: "Trek & nature" },
  { id: "plage", label: "Plage", icon: <Umbrella className="w-4 h-4" />, desc: "Soleil & sable" },
  { id: "roadtrip", label: "Road Trip", icon: <Car className="w-4 h-4" />, desc: "Route & liberté" },
];

const LuggageModes = ({ activeMode, onSelect }: LuggageModesProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.18 }}
    className="glass-card rounded-2xl p-6"
  >
    <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
      Mode de valise
    </h3>
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-center ${
            activeMode === mode.id
              ? "bg-primary/15 border border-primary/30 text-primary"
              : "bg-muted/30 hover:bg-muted/50 text-muted-foreground"
          }`}
        >
          {mode.icon}
          <p className="text-xs font-semibold">{mode.label}</p>
          <p className="text-[9px] opacity-70 hidden sm:block">{mode.desc}</p>
        </button>
      ))}
    </div>
  </motion.div>
);

export { modes };
export default LuggageModes;
