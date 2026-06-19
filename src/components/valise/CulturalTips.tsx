import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Globe, AlertTriangle, Shirt, Heart, RefreshCw, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface CulturalTipsProps {
  destination: string;
  tripType?: string;
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

const TIP_KEYS = ["dress", "customs", "avoid", "behavior"] as const;
type TipKey = typeof TIP_KEYS[number];

const ICONS: Record<TipKey, JSX.Element> = {
  dress: <Shirt className="w-4 h-4" />,
  customs: <Globe className="w-4 h-4" />,
  avoid: <AlertTriangle className="w-4 h-4" />,
  behavior: <Heart className="w-4 h-4" />,
};

type AiTips = Record<TipKey, { title: string; text: string }>;

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_PREFIX = "xplania-valise-cultural-v1:";

function readCache(key: string): AiTips | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { tips: AiTips; ts: number };
    if (!parsed?.tips) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.tips;
  } catch { return null; }
}

function writeCache(key: string, tips: AiTips) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ tips, ts: Date.now() }));
  } catch { /* quota */ }
}

const CulturalTips = ({ destination, tripType }: CulturalTipsProps) => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "fr").startsWith("en") ? "en" : "fr";
  const region = findRegionKey(destination);

  const isPlaceholderDest = !destination
    || destination === "votre destination"
    || destination.toLowerCase().includes("your destination");

  const [aiTips, setAiTips] = useState<AiTips | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [hadError, setHadError] = useState(false);
  const [variation, setVariation] = useState(0);

  const cacheKey = useMemo(
    () => `${lang}:${(destination || "").toLowerCase().trim()}:${(tripType || "").toLowerCase().trim()}`,
    [lang, destination, tripType]
  );

  const fetchTips = useCallback(async (force = false, variationSeed = 0) => {
    if (isPlaceholderDest) return;
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached) { setAiTips(cached); return; }
    }
    setIsFetching(true);
    setHadError(false);
    try {
      const { data, error } = await supabase.functions.invoke("valise-cultural-tips", {
        body: { destination, tripType: tripType || "", locale: lang, variation: variationSeed },
      });
      if (error) {
        console.error("[CulturalTips] invoke error", { message: error.message, name: error.name, context: (error as any).context });
        throw error;
      }
      if ((data as any)?.error) {
        console.error("[CulturalTips] server error payload", data);
        throw new Error((data as any).error);
      }
      const tips = data?.tips as AiTips | undefined;
      if (tips && tips.dress && tips.dress.text) {
        setAiTips(tips);
        writeCache(cacheKey, tips);
      } else {
        console.error("[CulturalTips] empty tips response", data);
        setHadError(true);
      }
    } catch (e) {
      console.error("[CulturalTips] fetch error", e);
      setHadError(true);
    } finally {
      setIsFetching(false);
    }
  }, [cacheKey, destination, tripType, lang, isPlaceholderDest]);

  const handleRegenerate = useCallback(() => {
    const next = variation + 1;
    setVariation(next);
    fetchTips(true, next);
  }, [variation, fetchTips]);

  useEffect(() => {
    setAiTips(null);
    if (!isPlaceholderDest) fetchTips(false);
  }, [cacheKey, isPlaceholderDest, fetchTips]);

  const resolveTip = (key: TipKey): { title: string; text: string } => {
    if (aiTips && aiTips[key]?.text) return aiTips[key];
    return {
      title: t(`valise.culturalTips.${region}.${key}.title`, {
        defaultValue: t(`valise.culturalTips.default.${key}.title`, { defaultValue: key }),
      }),
      text: t(`valise.culturalTips.${region}.${key}.text`, {
        defaultValue: t(`valise.culturalTips.default.${key}.text`, { defaultValue: "" }),
      }),
    };
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-card rounded-2xl p-6"
      aria-labelledby="cultural-tips-title"
      aria-busy={isFetching}
    >
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3
            id="cultural-tips-title"
            className="text-base font-bold text-foreground flex items-center gap-2"
          >
            {t("valise.culturalTitle", { destination })}
            {aiTips && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-semibold"
                aria-label={t("valise.culturalAiBadge")}
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" /> {t("valise.culturalAiBadge")}
              </span>
            )}
          </h3>
        </div>
        {!isPlaceholderDest && (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/60 text-xs font-medium text-foreground transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={t("valise.culturalRegenerate")}
            aria-controls="cultural-tips-list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{t("valise.culturalRegenerate")}</span>
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite" role="status">
        {isFetching
          ? t("valise.culturalLoading", { defaultValue: "Loading cultural tips…" })
          : hadError
            ? t("valise.culturalError")
            : aiTips
              ? t("valise.culturalLoaded", { defaultValue: "Cultural tips updated." })
              : ""}
      </p>

      {hadError && (
        <p className="text-xs text-amber-500/90 mb-3" role="alert">
          {t("valise.culturalError")}
        </p>
      )}

      {isFetching && !aiTips ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          role="status"
          aria-label={t("valise.culturalLoading", { defaultValue: "Loading cultural tips…" })}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-muted/30 space-y-2" aria-hidden="true">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <ul
          id="cultural-tips-list"
          role="list"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0"
        >
          {TIP_KEYS.map((key) => {
            const { title, text } = resolveTip(key);
            const headingId = `cultural-tip-${key}-title`;
            return (
              <li
                key={key}
                tabIndex={0}
                aria-labelledby={headingId}
                aria-describedby={`${headingId}-desc`}
                className="p-4 rounded-xl bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary" aria-hidden="true">{ICONS[key]}</span>
                  <p id={headingId} className="text-sm font-semibold text-foreground">{title}</p>
                </div>
                <p
                  id={`${headingId}-desc`}
                  className="text-xs text-muted-foreground leading-relaxed"
                >
                  {text}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
};


export default CulturalTips;
