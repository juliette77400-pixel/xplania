import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mountain, Umbrella, Compass, Camera, Briefcase, Car,
  Dumbbell, Utensils, CheckCircle, Plus
} from "lucide-react";
import { toast } from "sonner";

interface ActivityItemsProps {
  objectives?: string[];
  onAddToChecklist?: (items: string[]) => void;
}

type ActivityKey = "hiking" | "beach" | "city" | "photo" | "business" | "roadtrip" | "sport" | "gastro";

const activityMeta: Record<ActivityKey, { icon: React.ReactNode; color: string; matchers: string[] }> = {
  hiking:   { icon: <Mountain className="w-5 h-5" />,  color: "from-green-500/20 to-emerald-500/10",  matchers: ["rando", "nature", "trek", "hik", "mountain"] },
  beach:    { icon: <Umbrella className="w-5 h-5" />,  color: "from-cyan-500/20 to-blue-500/10",      matchers: ["plage", "mer", "soleil", "repos", "beach", "swim"] },
  city:     { icon: <Compass className="w-5 h-5" />,   color: "from-violet-500/20 to-purple-500/10",  matchers: ["ville", "culture", "musée", "découvrir", "city", "museum"] },
  photo:    { icon: <Camera className="w-5 h-5" />,    color: "from-orange-500/20 to-amber-500/10",   matchers: ["photo", "créat", "creat"] },
  business: { icon: <Briefcase className="w-5 h-5" />, color: "from-slate-500/20 to-gray-500/10",     matchers: ["business", "travail", "professionnel", "work"] },
  roadtrip: { icon: <Car className="w-5 h-5" />,       color: "from-rose-500/20 to-pink-500/10",      matchers: ["road", "voiture", "car"] },
  sport:    { icon: <Dumbbell className="w-5 h-5" />,  color: "from-red-500/20 to-orange-500/10",     matchers: ["sport", "fitness"] },
  gastro:   { icon: <Utensils className="w-5 h-5" />,  color: "from-amber-500/20 to-yellow-500/10",   matchers: ["gastro", "cuisine", "restaurant", "food"] },
};

const ActivityItems = ({ objectives, onAddToChecklist }: ActivityItemsProps) => {
  const { t } = useTranslation();
  const [addedActivities, setAddedActivities] = useState<Set<string>>(new Set());
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  // Highlight activities matching user objectives
  const highlighted = new Set<string>();
  if (objectives) {
    for (const obj of objectives) {
      const lower = obj.toLowerCase();
      if (lower.includes("rando") || lower.includes("nature") || lower.includes("trek") || lower.includes("hik")) highlighted.add("Randonnée");
      if (lower.includes("plage") || lower.includes("mer") || lower.includes("soleil") || lower.includes("repos") || lower.includes("beach")) highlighted.add("Plage");
      if (lower.includes("ville") || lower.includes("culture") || lower.includes("musée") || lower.includes("découvrir") || lower.includes("city") || lower.includes("museum")) highlighted.add("Ville");
      if (lower.includes("photo") || lower.includes("créat") || lower.includes("creat")) highlighted.add("Photo / Création");
      if (lower.includes("business") || lower.includes("travail") || lower.includes("professionnel") || lower.includes("work")) highlighted.add("Business");
      if (lower.includes("road") || lower.includes("voiture") || lower.includes("car")) highlighted.add("Road trip");
      if (lower.includes("sport") || lower.includes("fitness")) highlighted.add("Sport / Fitness");
      if (lower.includes("gastro") || lower.includes("cuisine") || lower.includes("restaurant") || lower.includes("food")) highlighted.add("Gastronomie");
    }
  }

  const sortedActivities = Object.entries(activityData).sort(([a], [b]) => {
    const aH = highlighted.has(a) ? -1 : 0;
    const bH = highlighted.has(b) ? -1 : 0;
    return aH - bH;
  });

  const handleAddAll = (activity: string, items: string[]) => {
    setAddedActivities((p) => new Set(p).add(activity));
    onAddToChecklist?.(items);
    toast.success(t("valise.activitiesToastAdded", { count: items.length }), { description: activity });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-foreground">{t("valise.activitiesTitle")}</h3>
        {highlighted.size > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {t("valise.activitiesDetected", { count: highlighted.size })}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t("valise.activitiesSubtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedActivities.map(([activity, { icon, items, color }]) => {
          const isHighlighted = highlighted.has(activity);
          const isAdded = addedActivities.has(activity);
          const isExpanded = expandedActivity === activity;

          return (
            <motion.div
              key={activity}
              layout
              whileHover={{ scale: 1.01 }}
              className={`rounded-xl overflow-hidden border transition-colors ${
                isHighlighted
                  ? "border-primary/30 bg-gradient-to-br " + color
                  : "border-transparent bg-muted/20"
              }`}
            >
              <button
                onClick={() => setExpandedActivity(isExpanded ? null : activity)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={isHighlighted ? "text-primary" : "text-muted-foreground"}>{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activity}</p>
                    <p className="text-[10px] text-muted-foreground">{t("valise.activitiesItemsCount", { count: items.length })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isHighlighted && !isAdded && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                      {t("valise.activitiesRecommended")}
                    </span>
                  )}
                  {isAdded && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-1.5">
                      {items.map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {item}
                        </motion.div>
                      ))}
                      {!isAdded && onAddToChecklist && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => handleAddAll(activity, items)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t("valise.activitiesAddAll")}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ActivityItems;
