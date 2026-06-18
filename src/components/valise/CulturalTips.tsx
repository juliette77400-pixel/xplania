import { motion } from "framer-motion";
import { Globe, AlertTriangle, Shirt, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CulturalTipsProps {
  destination: string;
}

const REGION_KEYS = ["japon", "japan", "maroc", "morocco", "thailande", "thailand", "australie", "australia"] as const;

const REGION_ALIASES: Record<string, string> = {
  japan: "japon",
  morocco: "maroc",
  thailand: "thailande",
  australia: "australie",
};

function findRegionKey(destination: string): string {
  const lower = destination.toLowerCase();
  for (const key of REGION_KEYS) {
    if (lower.includes(key)) return REGION_ALIASES[key] ?? key;
  }
  return "default";
}

const CulturalTips = ({ destination }: CulturalTipsProps) => {
  const { t } = useTranslation();
  const region = findRegionKey(destination);

  const tips = [
    { icon: <Shirt className="w-4 h-4" />, key: "dress" },
    { icon: <Globe className="w-4 h-4" />, key: "customs" },
    { icon: <AlertTriangle className="w-4 h-4" />, key: "avoid" },
    { icon: <Heart className="w-4 h-4" />, key: "behavior" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">{t("valise.culturalTitle", { destination })}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tips.map((tip) => {
          const title = t(`valise.culturalTips.${region}.${tip.key}.title`, {
            defaultValue: t(`valise.culturalTips.default.${tip.key}.title`, { defaultValue: tip.key }),
          });
          const text = t(`valise.culturalTips.${region}.${tip.key}.text`, {
            defaultValue: t(`valise.culturalTips.default.${tip.key}.text`, { defaultValue: "" }),
          });
          return (
            <div key={tip.key} className="p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-primary">{tip.icon}</span>
                <p className="text-sm font-semibold text-foreground">{title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CulturalTips;
