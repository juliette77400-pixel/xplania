import { motion } from "framer-motion";
import { Plane, Train, Car, Ship } from "lucide-react";
import { useTranslation } from "react-i18next";

export type TransportMode = "avion" | "train" | "voiture" | "bateau";

interface TransportSelectorProps {
  active: TransportMode;
  onSelect: (mode: TransportMode) => void;
  isLoading?: boolean;
}

export const transports: { id: TransportMode; icon: React.ReactNode; emoji: string }[] = [
  { id: "avion", icon: <Plane className="w-4 h-4" />, emoji: "✈️" },
  { id: "train", icon: <Train className="w-4 h-4" />, emoji: "🚆" },
  { id: "voiture", icon: <Car className="w-4 h-4" />, emoji: "🚗" },
  { id: "bateau", icon: <Ship className="w-4 h-4" />, emoji: "🚢" },
];

const TransportSelector = ({ active, onSelect, isLoading }: TransportSelectorProps) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">{t("valise.transportTitle")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(`valise.transports.${active}Hint`)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {transports.map((tr) => {
          const isActive = active === tr.id;
          return (
            <motion.button
              key={tr.id}
              onClick={() => !isLoading && onSelect(tr.id)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              className={`relative flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span className="text-2xl">{tr.emoji}</span>
              <span className="text-xs font-semibold">{t(`valise.transports.${tr.id}`)}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TransportSelector;
