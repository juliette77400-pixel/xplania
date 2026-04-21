import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { CloudSun, Thermometer, Eye, Shirt, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Outfit {
  id: string;
  imageUrl: string;
}

interface OutfitRecommendationsProps {
  tripType?: string;
  destination?: string;
}

const allOutfits: Outfit[] = [
  { id: "casualUrban", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80" },
  { id: "elegantEvening", imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80" },
  { id: "natureExploration", imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80" },
  { id: "beachRelax", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" },
  { id: "businessTravel", imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80" },
];

// Map trip types to relevant outfit IDs
function getRelevantOutfits(tripType?: string): Outfit[] {
  if (!tripType) return allOutfits.slice(0, 3);
  const lower = tripType.toLowerCase();
  if (lower.includes("plage") || lower.includes("relax") || lower.includes("balnéaire") || lower.includes("beach"))
    return allOutfits.filter((o) => ["beachRelax", "casualUrban"].includes(o.id));
  if (lower.includes("business") || lower.includes("professionnel") || lower.includes("work"))
    return allOutfits.filter((o) => ["businessTravel", "elegantEvening"].includes(o.id));
  if (lower.includes("aventure") || lower.includes("rando") || lower.includes("nature") || lower.includes("hik") || lower.includes("adventure"))
    return allOutfits.filter((o) => ["natureExploration", "casualUrban"].includes(o.id));
  return allOutfits.slice(0, 3);
}

const OutfitRecommendations = ({ tripType, destination }: OutfitRecommendationsProps) => {
  const { t } = useTranslation();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const outfits = useMemo(() => getRelevantOutfits(tripType), [tripType]);
  const displayOutfits = outfits.length > 0 ? outfits : allOutfits.slice(0, 3);

  const isPlaceholderDest = !destination
    || destination === "votre destination"
    || destination.toLowerCase().includes("your destination");

  const getOutfit = (id: string) => ({
    title: t(`valise.outfits.${id}.title`),
    context: t(`valise.outfits.${id}.context`),
    badge: t(`valise.outfits.${id}.badge`),
    tags: t(`valise.outfits.${id}.tags`, { returnObjects: true }) as string[],
    items: t(`valise.outfits.${id}.items`, { returnObjects: true }) as string[],
    weatherTip: t(`valise.outfits.${id}.weatherTip`),
    culturalTip: t(`valise.outfits.${id}.culturalTip`),
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="space-y-5"
      >
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">{t("valise.outfitsTitle")}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("valise.outfitsSubtitle")}
            {!isPlaceholderDest && (
              <> — <span className="text-primary font-medium">{destination}</span></>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {displayOutfits.map((outfit, i) => {
            const data = getOutfit(outfit.id);
            return (
              <motion.button
                key={outfit.id}
                onClick={() => setSelectedOutfit(outfit)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card rounded-2xl overflow-hidden group text-left cursor-pointer"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={outfit.imageUrl}
                    alt={data.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-primary/20 backdrop-blur-md text-primary text-[10px] font-bold uppercase tracking-wider">
                    {data.badge}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/40 backdrop-blur-sm">
                    <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
                      <Eye className="w-3.5 h-3.5" /> {t("valise.outfitsViewDetails")}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">{data.title}</h4>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{data.context}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {data.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Detail modal */}
      <Dialog open={!!selectedOutfit} onOpenChange={() => setSelectedOutfit(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          {selectedOutfit && (() => {
            const data = getOutfit(selectedOutfit.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Shirt className="w-5 h-5 text-primary" />
                    {data.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="relative h-48 rounded-xl overflow-hidden mt-2">
                  <img
                    src={selectedOutfit.imageUrl}
                    alt={data.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-primary/20 backdrop-blur text-primary text-xs font-bold">
                    {data.badge}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {t("valise.outfitsComposition")}
                  </h4>
                  <div className="space-y-1.5">
                    {data.items.map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <p className="text-sm text-foreground">{item}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-primary/5 flex items-start gap-2">
                    <CloudSun className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{t("valise.outfitsWeatherTip")}</p>
                      <p className="text-xs text-foreground mt-0.5">{data.weatherTip}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/5 flex items-start gap-2">
                    <Thermometer className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{t("valise.outfitsCulturalTip")}</p>
                      <p className="text-xs text-foreground mt-0.5">{data.culturalTip}</p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OutfitRecommendations;
