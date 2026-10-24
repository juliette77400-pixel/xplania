// Practical luggage profiles: long Erasmus stay, internship, cabin only,
// checked luggage, sports equipment. Each adds its own checklist items.
import { motion } from "framer-motion";
import { Briefcase, Dumbbell, GraduationCap, Luggage, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { VALISE_PROFILES, type ValiseProfile } from "@/lib/valise-profiles";
import { cn } from "@/lib/utils";

export type LuggageMode = ValiseProfile;

interface LuggageModesProps {
  activeMode: LuggageMode;
  onSelect: (mode: LuggageMode) => void;
  suggestedMode?: LuggageMode | null;
  isLoading?: boolean;
}

const ICONS: Record<LuggageMode, typeof Luggage> = {
  erasmus: GraduationCap,
  stage: Briefcase,
  cabine: ShoppingBag,
  soute: Luggage,
  sport: Dumbbell,
};

const LuggageModes = ({ activeMode, onSelect, suggestedMode, isLoading }: LuggageModesProps) => {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-foreground">{t("valise2.profiles.title")}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("valise2.profiles.subtitle")}</p>
      </div>
      <div role="radiogroup" aria-label={t("valise2.profiles.title")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {VALISE_PROFILES.map((id) => {
          const Icon = ICONS[id];
          const active = activeMode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={isLoading}
              onClick={() => !isLoading && onSelect(id)}
              className={cn(
                "flex flex-col gap-1.5 rounded-2xl border-2 p-4 text-left transition-colors disabled:opacity-60",
                active ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/40",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
                {suggestedMode === id && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{t("valise2.profiles.suggested")}</span>}
              </span>
              <span className="text-sm font-bold">{t(`valise2.profiles.${id}.label`)}</span>
              <span className="text-xs text-muted-foreground">{t(`valise2.profiles.${id}.desc`)}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LuggageModes;
