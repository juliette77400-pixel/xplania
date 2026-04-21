import { motion } from "framer-motion";
import {
  Briefcase, Camera, Mountain, Umbrella, Car, Sparkles,
  PackageOpen, Compass, Shirt, Building2, Gem
} from "lucide-react";
import { useTranslation } from "react-i18next";

export type LuggageMode =
  | "minimaliste" | "confort" | "stylée" | "aventure"
  | "business" | "photo" | "randonnée" | "plage" | "roadtrip"
  | "urbain" | "luxe";

interface LuggageModesProps {
  activeMode: LuggageMode;
  onSelect: (mode: LuggageMode) => void;
  suggestedMode?: LuggageMode | null;
  isLoading?: boolean;
}

// 11 premium styles, each with a curated Unsplash image (landscape, high quality). Labels translated dynamically.
const modes: {
  id: LuggageMode;
  icon: React.ReactNode;
  emoji: string;
  image: string;
}[] = [
  { id: "minimaliste", icon: <PackageOpen className="w-4 h-4" />, emoji: "🎒", image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=600&q=80&auto=format&fit=crop" },
  { id: "confort",     icon: <Sparkles className="w-4 h-4" />,    emoji: "✨", image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80&auto=format&fit=crop" },
  { id: "stylée",      icon: <Shirt className="w-4 h-4" />,       emoji: "👗", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&auto=format&fit=crop" },
  { id: "aventure",    icon: <Compass className="w-4 h-4" />,     emoji: "🧭", image: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&q=80&auto=format&fit=crop" },
  { id: "business",    icon: <Briefcase className="w-4 h-4" />,   emoji: "💼", image: "https://images.unsplash.com/photo-1521334884684-d80222895322?w=600&q=80&auto=format&fit=crop" },
  { id: "photo",       icon: <Camera className="w-4 h-4" />,      emoji: "📸", image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80&auto=format&fit=crop" },
  { id: "randonnée",   icon: <Mountain className="w-4 h-4" />,    emoji: "🥾", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80&auto=format&fit=crop" },
  { id: "plage",       icon: <Umbrella className="w-4 h-4" />,    emoji: "🏖️", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&auto=format&fit=crop" },
  { id: "roadtrip",    icon: <Car className="w-4 h-4" />,         emoji: "🚗", image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80&auto=format&fit=crop" },
  { id: "urbain",      icon: <Building2 className="w-4 h-4" />,   emoji: "🏙️", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80&auto=format&fit=crop" },
  { id: "luxe",        icon: <Gem className="w-4 h-4" />,         emoji: "💎", image: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=600&q=80&auto=format&fit=crop" },
];

const LuggageModes = ({ activeMode, onSelect, suggestedMode, isLoading }: LuggageModesProps) => {
  const { t } = useTranslation();
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.18 }}
    className="space-y-4"
  >
    {/* Header */}
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h3 className="text-sm font-bold text-foreground">{t("valise.modesTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("valise.modesSubtitle")}
        </p>
      </div>
      {suggestedMode && (
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold animate-pulse">
          {t("valise.modesAiSuggestion", { label: t(`valise.modesLabels.${suggestedMode}`) })}
        </span>
      )}
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        const isSuggested = suggestedMode === mode.id && !isActive;
        const label = t(`valise.modesLabels.${mode.id}`);
        const desc = t(`valise.modesDesc.${mode.id}`);
        return (
          <motion.button
            key={mode.id}
            onClick={() => !isLoading && onSelect(mode.id)}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            disabled={isLoading}
            className={`relative group rounded-2xl overflow-hidden text-left transition-all duration-300 border-2 ${
              isActive
                ? "border-primary shadow-xl shadow-primary/30 ring-2 ring-primary/40"
                : isSuggested
                ? "border-primary/40 shadow-lg"
                : "border-border/40 hover:border-border"
            } ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={mode.image}
                alt={label}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
              {isSuggested && (
                <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wide animate-pulse">
                  {t("valise.modesAi")}
                </span>
              )}
              {isActive && (
                <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wide">
                  {t("valise.modesActive")}
                </span>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-base leading-none">{mode.emoji}</span>
                <span className="text-sm font-bold text-foreground">{label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{desc}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
  );
};

export { modes };
export default LuggageModes;

