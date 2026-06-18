import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lightbulb, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { LuggageMode } from "./LuggageModes";

interface AiTipCardProps {
  mode: LuggageMode;
  isLoading?: boolean;
  destination?: string;
}

const emojis: Record<LuggageMode, string> = {
  minimaliste: "🎒", confort: "✨", stylée: "👗", aventure: "🧭",
  business: "💼", photo: "📸", randonnée: "🥾", plage: "🏖️",
  roadtrip: "🚗", urbain: "🏙️", luxe: "💎",
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const CACHE_PREFIX = "xplania-valise-aitip-v1:";

interface CachedTip {
  title: string;
  tip: string;
  ts: number;
}

function readCache(key: string): CachedTip | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTip;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: Omit<CachedTip, "ts">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ...value, ts: Date.now() }));
  } catch {
    /* quota */
  }
}

function parseTip(raw: string, fallbackTitle: string): { title: string; tip: string } {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { title: fallbackTitle, tip: "" };
  // Take first non-empty line as title if short, rest as body.
  const lines = trimmed.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2 && lines[0].length <= 80) {
    return { title: lines[0].replace(/^[#*\-•\s]+/, ""), tip: lines.slice(1).join(" ") };
  }
  return { title: fallbackTitle, tip: trimmed };
}

const AiTipCard = ({ mode, isLoading, destination }: AiTipCardProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "fr";

  const staticTitle = t(`valise.aiTips.${mode}.title`, { defaultValue: t("valise.aiTipFallbackTitle") });
  const staticTip = t(`valise.aiTips.${mode}.tip`, { defaultValue: "" });

  const cacheKey = `${lang}:${mode}:${(destination || "").toLowerCase().trim()}`;

  const [dynamicTip, setDynamicTip] = useState<{ title: string; tip: string } | null>(null);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const inFlightRef = useRef(false);

  const fetchTip = useCallback(
    async (force = false) => {
      if (inFlightRef.current) return;
      if (!force) {
        const cached = readCache(cacheKey);
        if (cached) {
          setDynamicTip({ title: cached.title, tip: cached.tip });
          return;
        }
      }
      inFlightRef.current = true;
      setLoadingDynamic(true);
      try {
        const question =
          lang === "en"
            ? `Give me ONE fresh, very concrete packing tip (max 50 words) for a "${mode}" traveller${
                destination ? ` going to ${destination}` : ""
              }. Format: line 1 = short catchy title with one emoji, line 2 = the actionable tip. No intro, no outro.`
            : `Donne-moi UN conseil packing frais, très concret (max 50 mots) pour un voyageur "${mode}"${
                destination ? ` qui part à ${destination}` : ""
              }. Format : ligne 1 = titre court accrocheur avec un emoji, ligne 2 = le conseil actionnable. Pas d'intro ni d'outro.`;

        const { data, error } = await supabase.functions.invoke("valise-qa", {
          body: {
            question,
            history: [],
            destination: destination || "",
            luggage: mode,
            locale: lang,
          },
        });
        if (error) throw error;
        const answer = (data as { answer?: string } | null)?.answer || "";
        const parsed = parseTip(answer, staticTitle);
        if (parsed.tip) {
          setDynamicTip(parsed);
          writeCache(cacheKey, parsed);
        }
      } catch (e) {
        console.warn("AiTipCard fetch failed", e);
      } finally {
        inFlightRef.current = false;
        setLoadingDynamic(false);
      }
    },
    [cacheKey, destination, lang, mode, staticTitle],
  );

  // On mode/destination/lang change: load from cache or fetch.
  useEffect(() => {
    const cached = readCache(cacheKey);
    if (cached) {
      setDynamicTip({ title: cached.title, tip: cached.tip });
    } else {
      setDynamicTip(null);
      void fetchTip(false);
    }
  }, [cacheKey, fetchTip]);

  const displayTitle = dynamicTip?.title || staticTitle;
  const displayTip = dynamicTip?.tip || staticTip;
  const showSkeleton = isLoading || (loadingDynamic && !dynamicTip && !staticTip);

  return (
    <AnimatePresence mode="wait">
      {showSkeleton ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-foreground">{t("valise.aiTipAnalyzing")}</p>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={`${mode}-${dynamicTip ? "dyn" : "static"}`}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl p-5 flex items-start gap-4 shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 text-xl">
            {emojis[mode]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-primary shrink-0" />
              <h4 className="text-sm font-bold text-foreground truncate">{displayTitle}</h4>
              <button
                type="button"
                onClick={() => void fetchTip(true)}
                disabled={loadingDynamic}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                title={t("valise.aiTipRegenerate", { defaultValue: lang === "en" ? "New tip" : "Nouveau conseil" })}
                aria-label={t("valise.aiTipRegenerate", { defaultValue: lang === "en" ? "New tip" : "Nouveau conseil" })}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDynamic ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">
                  {t("valise.aiTipRegenerate", { defaultValue: lang === "en" ? "New tip" : "Nouveau conseil" })}
                </span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{displayTip}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiTipCard;
