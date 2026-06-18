import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { CloudSun, Thermometer, Eye, Shirt, ChevronRight, RefreshCw, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Outfit {
  id: string;
  gradient: string;
  emoji: string;
  title?: string;
  context?: string;
  badge?: string;
  tags?: string[];
  items?: string[];
  weatherTip?: string;
  culturalTip?: string;
  ai?: boolean;
}

interface OutfitRecommendationsProps {
  tripType?: string;
  destination?: string;
  activities?: string[];
  luggage?: string;
  onAddToChecklist?: (items: string[]) => void;
}

// ----- Static fallback (i18n-driven) -----
const FALLBACK_OUTFITS: Outfit[] = [
  { id: "casualUrban",       gradient: "from-violet-600 via-indigo-700 to-slate-900", emoji: "👟🧥" },
  { id: "elegantEvening",    gradient: "from-fuchsia-600 via-purple-700 to-rose-900", emoji: "👗✨" },
  { id: "natureExploration", gradient: "from-emerald-500 via-teal-700 to-slate-900",  emoji: "🥾🌲" },
  { id: "beachRelax",        gradient: "from-cyan-400 via-sky-600 to-blue-900",       emoji: "👙🌴" },
  { id: "businessTravel",    gradient: "from-slate-600 via-slate-800 to-zinc-900",    emoji: "👔💼" },
];

function getRelevantFallback(tripType?: string): Outfit[] {
  if (!tripType) return FALLBACK_OUTFITS.slice(0, 3);
  const lower = tripType.toLowerCase();
  if (lower.includes("plage") || lower.includes("relax") || lower.includes("balnéaire") || lower.includes("beach"))
    return FALLBACK_OUTFITS.filter((o) => ["beachRelax", "casualUrban"].includes(o.id));
  if (lower.includes("business") || lower.includes("professionnel") || lower.includes("work"))
    return FALLBACK_OUTFITS.filter((o) => ["businessTravel", "elegantEvening"].includes(o.id));
  if (lower.includes("aventure") || lower.includes("rando") || lower.includes("nature") || lower.includes("hik") || lower.includes("adventure"))
    return FALLBACK_OUTFITS.filter((o) => ["natureExploration", "casualUrban"].includes(o.id));
  return FALLBACK_OUTFITS.slice(0, 3);
}

// ----- AI cache -----
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_PREFIX = "xplania-valise-outfits-v1:";

interface CachedOutfits { outfits: Outfit[]; ts: number; }

function readCache(key: string): Outfit[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedOutfits;
    if (!parsed?.outfits?.length) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.outfits;
  } catch { return null; }
}

function writeCache(key: string, outfits: Outfit[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ outfits, ts: Date.now() }));
  } catch { /* quota */ }
}

const OutfitRecommendations = ({ tripType, destination, activities, luggage, onAddToChecklist }: OutfitRecommendationsProps) => {
  const { t, i18n } = useTranslation();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [aiOutfits, setAiOutfits] = useState<Outfit[] | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [hadError, setHadError] = useState(false);

  const lang = (i18n.language || "fr").startsWith("en") ? "en" : "fr";

  const isPlaceholderDest = !destination
    || destination === "votre destination"
    || destination.toLowerCase().includes("your destination");

  const cacheKey = useMemo(
    () => `${lang}:${(destination || "").toLowerCase().trim()}:${(tripType || "").toLowerCase().trim()}`,
    [lang, destination, tripType]
  );

  const fetchOutfits = useCallback(async (force = false) => {
    if (isPlaceholderDest) return;
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached) { setAiOutfits(cached); return; }
    }
    setIsFetching(true);
    setHadError(false);
    try {
      const { data, error } = await supabase.functions.invoke("valise-outfits", {
        body: {
          destination,
          tripType,
          activities: activities || [],
          luggage: luggage || "",
          locale: lang,
        },
      });
      if (error) throw error;
      const outfits = (data?.outfits || []) as Outfit[];
      if (outfits.length > 0) {
        const enriched = outfits.map((o, i) => ({ ...o, id: o.id || `ai-${i}`, ai: true }));
        setAiOutfits(enriched);
        writeCache(cacheKey, enriched);
      } else {
        setHadError(true);
      }
    } catch (e) {
      console.error("valise-outfits fetch error", e);
      setHadError(true);
    } finally {
      setIsFetching(false);
    }
  }, [cacheKey, destination, tripType, activities, luggage, lang, isPlaceholderDest]);

  useEffect(() => {
    setAiOutfits(null);
    if (!isPlaceholderDest) fetchOutfits(false);
  }, [cacheKey, isPlaceholderDest, fetchOutfits]);

  // Resolve outfit data: AI first, else fallback to i18n
  const getStatic = (id: string): Outfit => {
    const base = FALLBACK_OUTFITS.find((o) => o.id === id)!;
    return {
      ...base,
      title: t(`valise.outfits.${id}.title`),
      context: t(`valise.outfits.${id}.context`),
      badge: t(`valise.outfits.${id}.badge`),
      tags: t(`valise.outfits.${id}.tags`, { returnObjects: true }) as string[],
      items: t(`valise.outfits.${id}.items`, { returnObjects: true }) as string[],
      weatherTip: t(`valise.outfits.${id}.weatherTip`),
      culturalTip: t(`valise.outfits.${id}.culturalTip`),
    };
  };

  const displayOutfits: Outfit[] = aiOutfits && aiOutfits.length > 0
    ? aiOutfits
    : getRelevantFallback(tripType).map((o) => getStatic(o.id));

  const handleAddMissing = (outfit: Outfit) => {
    const items = (outfit.items || []).filter(Boolean);
    if (items.length === 0) return;
    if (onAddToChecklist) {
      onAddToChecklist(items);
      toast.success(t("valise.outfitsAdded", { count: items.length }));
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="space-y-5"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2 justify-center sm:justify-start">
              {t("valise.outfitsTitle")}
              {aiOutfits && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-semibold">
                  <Sparkles className="w-3 h-3" /> {t("valise.outfitsAiBadge")}
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("valise.outfitsSubtitle")}
              {!isPlaceholderDest && (
                <> — <span className="text-primary font-medium">{destination}</span></>
              )}
            </p>
          </div>
          {!isPlaceholderDest && (
            <button
              onClick={() => fetchOutfits(true)}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/60 text-xs font-medium text-foreground transition-colors disabled:opacity-50"
              aria-label={t("valise.outfitsRegenerate")}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {t("valise.outfitsRegenerate")}
            </button>
          )}
        </div>

        {hadError && (
          <p className="text-xs text-amber-500/90">{t("valise.outfitsError")}</p>
        )}

        {isFetching && !aiOutfits ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-muted/40" />
                <div className="p-4 space-y-2">
                  <div className="h-3.5 bg-muted/40 rounded w-3/5" />
                  <div className="h-2.5 bg-muted/30 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {displayOutfits.map((outfit, i) => (
              <motion.button
                key={outfit.id || i}
                onClick={() => setSelectedOutfit(outfit)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card rounded-2xl overflow-hidden group text-left cursor-pointer"
              >
                <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${outfit.gradient} flex items-center justify-center`}>
                  <span className="text-6xl drop-shadow-lg select-none" aria-hidden="true">
                    {outfit.emoji}
                  </span>
                  {outfit.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                      {outfit.badge}
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
                    <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
                      <Eye className="w-3.5 h-3.5" /> {t("valise.outfitsViewDetails")}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">{outfit.title}</h4>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  {outfit.context && (
                    <p className="text-xs text-muted-foreground mt-1">{outfit.context}</p>
                  )}
                  {outfit.tags && outfit.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {outfit.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Detail modal */}
      <Dialog open={!!selectedOutfit} onOpenChange={() => setSelectedOutfit(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          {selectedOutfit && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-primary" />
                  {selectedOutfit.title}
                </DialogTitle>
              </DialogHeader>

              <div className={`relative h-48 rounded-xl overflow-hidden mt-2 bg-gradient-to-br ${selectedOutfit.gradient} flex items-center justify-center`}>
                <span className="text-7xl drop-shadow-xl select-none" aria-hidden="true">
                  {selectedOutfit.emoji}
                </span>
                {selectedOutfit.badge && (
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-white/20 backdrop-blur text-white text-xs font-bold border border-white/20">
                    {selectedOutfit.badge}
                  </span>
                )}
              </div>

              {selectedOutfit.items && selectedOutfit.items.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {t("valise.outfitsComposition")}
                  </h4>
                  <div className="space-y-1.5">
                    {selectedOutfit.items.map((item, i) => (
                      <motion.div
                        key={`${item}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <p className="text-sm text-foreground">{item}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 mt-4">
                {selectedOutfit.weatherTip && (
                  <div className="p-3 rounded-xl bg-primary/5 flex items-start gap-2">
                    <CloudSun className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{t("valise.outfitsWeatherTip")}</p>
                      <p className="text-xs text-foreground mt-0.5">{selectedOutfit.weatherTip}</p>
                    </div>
                  </div>
                )}
                {selectedOutfit.culturalTip && (
                  <div className="p-3 rounded-xl bg-secondary/5 flex items-start gap-2">
                    <Thermometer className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{t("valise.outfitsCulturalTip")}</p>
                      <p className="text-xs text-foreground mt-0.5">{selectedOutfit.culturalTip}</p>
                    </div>
                  </div>
                )}
              </div>

              {onAddToChecklist && selectedOutfit.items && selectedOutfit.items.length > 0 && (
                <button
                  onClick={() => { handleAddMissing(selectedOutfit); setSelectedOutfit(null); }}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t("valise.outfitsAddMissing")}
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OutfitRecommendations;
