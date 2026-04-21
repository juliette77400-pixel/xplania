import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { MOODS, type MoodKey } from "@/lib/moods";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  onSubmit: (input: { mood?: MoodKey; free_input?: string; energy_level?: number; surprise?: boolean }) => void;
}

const MoodSelector = ({ loading, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<MoodKey | null>(null);
  const [freeInput, setFreeInput] = useState("");
  const [energy, setEnergy] = useState<number[]>([50]);

  const handleSubmit = () => {
    if (!selected && !freeInput.trim()) return;
    onSubmit({
      mood: selected || undefined,
      free_input: freeInput.trim() || undefined,
      energy_level: energy[0],
    });
  };

  const energyLabel = energy[0] < 33
    ? t("moodComp.selector.energyCalm")
    : energy[0] < 66
      ? t("moodComp.selector.energyBalanced")
      : t("moodComp.selector.energyBoost");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">{t("moodComp.selector.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("moodComp.selector.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {MOODS.map((m, i) => {
          const active = selected === m.key;
          const label = t(`moodComp.moods.${m.key}.label`, { defaultValue: m.label });
          const description = t(`moodComp.moods.${m.key}.description`, { defaultValue: m.description });
          return (
            <motion.button
              key={m.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelected(m.key)}
              className={cn(
                "relative rounded-2xl p-4 border backdrop-blur-sm transition-all text-left bg-gradient-to-br",
                m.gradient,
                active
                  ? "border-primary ring-2 ring-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)]"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="text-3xl mb-1">{m.emoji}</div>
              <div className={cn("font-bold text-sm", active && m.glow)}>{label}</div>
              <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{description}</div>
            </motion.button>
          );
        })}
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
            {t("moodComp.selector.energyLabel")} : {energyLabel}
          </label>
          <Slider value={energy} onValueChange={setEnergy} min={0} max={100} step={1} />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
            {t("moodComp.selector.freeLabel")}
          </label>
          <Textarea
            value={freeInput}
            onChange={(e) => setFreeInput(e.target.value)}
            placeholder={t("moodComp.selector.freePlaceholder")}
            className="min-h-[60px] resize-none"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={handleSubmit}
          disabled={loading || (!selected && !freeInput.trim())}
          className="flex-1 h-12 text-base"
          size="lg"
        >
          {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
          {t("moodComp.selector.submit")}
        </Button>
        <Button
          variant="outline"
          onClick={() => onSubmit({ surprise: true, energy_level: energy[0] })}
          disabled={loading}
          className="h-12"
          size="lg"
        >
          <Wand2 className="w-5 h-5 mr-2" /> {t("moodComp.selector.surprise")}
        </Button>
      </div>
    </div>
  );
};

export default MoodSelector;
