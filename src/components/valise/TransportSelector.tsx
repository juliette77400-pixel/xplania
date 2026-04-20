import { motion } from "framer-motion";
import { Plane, Train, Car, Ship } from "lucide-react";

export type TransportMode = "avion" | "train" | "voiture" | "bateau";

interface TransportSelectorProps {
  active: TransportMode;
  onSelect: (mode: TransportMode) => void;
  isLoading?: boolean;
}

export const transports: { id: TransportMode; label: string; icon: React.ReactNode; emoji: string; hint: string }[] = [
  { id: "avion", label: "Avion", icon: <Plane className="w-4 h-4" />, emoji: "✈️", hint: "Liquides <100ml, bagage cabine" },
  { id: "train", label: "Train", icon: <Train className="w-4 h-4" />, emoji: "🚆", hint: "Confort & flexibilité" },
  { id: "voiture", label: "Voiture", icon: <Car className="w-4 h-4" />, emoji: "🚗", hint: "Espace illimité, route" },
  { id: "bateau", label: "Bateau", icon: <Ship className="w-4 h-4" />, emoji: "🚢", hint: "Anti-mal de mer, soleil" },
];

const TransportSelector = ({ active, onSelect, isLoading }: TransportSelectorProps) => {
  const activeTransport = transports.find((t) => t.id === active);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Mode de transport</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeTransport?.hint}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {transports.map((t) => {
          const isActive = active === t.id;
          return (
            <motion.button
              key={t.id}
              onClick={() => !isLoading && onSelect(t.id)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              className={`relative flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-xs font-semibold">{t.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TransportSelector;
