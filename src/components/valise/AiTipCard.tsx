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
  /** Stay dates, so clothes match the season. */
  months?: string;
  /** Planned activities, in the user's language. */
  activities?: string[];
  stayType?: string;
  transport?: string;
  days?: number;
  /** Real climate figures for the stay months (never invented). */
  climate?: string;
}

// Each click asks about another angle, so a new tip is really new.
const TOPICS_FR = ["vêtements pour la saison et le climat de ces mois", "équipement lié à une des activités prévues", "documents et copies à emporter", "adaptateur et électronique", "limites de taille et de poids des bagages pour ce transport", "trousse de santé et pharmacie pour un long séjour", "affaires pour les cours ou le stage", "ce qu'il vaut mieux acheter sur place plutôt qu'emporter"];
const TOPICS_EN = ["clothes for the season and climate of these months", "gear for one of the planned activities", "documents and copies to bring", "plug adapter and electronics", "luggage size and weight limits for this transport", "health kit for a long stay", "things for classes or the internship", "what is better bought there than packed"];

const emojis: Record<LuggageMode, string> = { erasmus: "🎓", stage: "💼", cabine: "🎒", soute: "🧳", sport: "⚽" };

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const CACHE_PREFIX = "xplania-valise-aitip-v2:";

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

const AiTipCard = ({ mode, isLoading, destination, months, activities = [], stayType, transport, days, climate }: AiTipCardProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "fr";

  const staticTitle = t(`valise2.aiTips.${mode}.title`, { defaultValue: t("valise.aiTipFallbackTitle") });
  const staticTip = t(`valise2.aiTips.${mode}.tip`, { defaultValue: "" });
  const profileLabel = t(`valise2.profiles.${mode}.label`);

  const actKey = activities.join(",");
  const cacheKey = `${lang}:${mode}:${(destination || "").toLowerCase().trim()}:${actKey}:${transport || ""}:${months || ""}`;

  const [dynamicTip, setDynamicTip] = useState<{ title: string; tip: string } | null>(null);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [tipError, setTipError] = useState<"quota" | "error" | null>(null);
  const inFlightRef = useRef(false);
  const shownRef = useRef<string[]>([]);
  const topicRef = useRef(Math.floor(Math.random() * TOPICS_FR.length));

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
        topicRef.current = (topicRef.current + (force ? 1 : 0)) % TOPICS_FR.length;
        const topic = (lang === "en" ? TOPICS_EN : TOPICS_FR)[topicRef.current];
        const avoid = shownRef.current.slice(-6).join(" | ");
        const question =
          lang === "en"
            ? `Give me ONE new, concrete packing tip (max 50 words) for this student. Topic: ${topic}. Use the trip data provided (destination, dates, length, kind of stay, activities, transport, luggage profile "${profileLabel}"${climate ? `, real climate figures: ${climate}` : ""}). Never invent a weather event the figures don't show. No gadget, no brand, nothing valid for any trip. Different from these previous tips: ${avoid || "none"}. Format: line 1 = short title with one emoji, line 2 = the actionable tip. No intro, no outro.`
            : `Donne-moi UN nouveau conseil de valise concret (max 50 mots) pour cet étudiant. Sujet : ${topic}. Appuie-toi sur les données du séjour fournies (destination, dates, durée, type de séjour, activités, transport, profil de bagage « ${profileLabel} »${climate ? `, chiffres réels du climat : ${climate}` : ""}). N'invente jamais un phénomène météo absent des chiffres. Pas de gadget, pas de marque, rien qui vaille pour n'importe quel voyage. Différent de ces conseils déjà donnés : ${avoid || "aucun"}. Format : ligne 1 = titre court avec un emoji, ligne 2 = le conseil actionnable. Pas d'intro ni d'outro.`;
        setTipError(null);

        const { data, error } = await supabase.functions.invoke("valise-qa", {
          body: {
            question,
            history: [],
            destination: destination || "",
            luggage: mode,
            locale: lang,
            activities,
            tripType: stayType || "",
            duration: days ? `${days} days` : "",
            startDate: months?.split(" → ")[0] || "",
            endDate: months?.split(" → ")[1] || "",
          },
        });
        if (error) {
          const status = (error as { context?: Response })?.context?.status;
          setTipError(status === 402 ? "quota" : "error");
          return;
        }
        const answer = (data as { answer?: string } | null)?.answer || "";
        const parsed = parseTip(answer, staticTitle);
        if (parsed.tip) {
          setDynamicTip(parsed);
          shownRef.current = [...shownRef.current, parsed.title].slice(-10);
          writeCache(cacheKey, parsed);
        } else {
          setTipError("error");
        }
      } catch (e) {
        console.warn("AiTipCard fetch failed", e);
        setTipError("error");
      } finally {
        inFlightRef.current = false;
        setLoadingDynamic(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey, destination, lang, mode, staticTitle, profileLabel, months, actKey, stayType, transport, days, climate],
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
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                title={t("valise.aiTipRegenerate", { defaultValue: lang === "en" ? "New tip" : "Nouveau conseil" })}
                aria-label={t("valise.aiTipRegenerate", { defaultValue: lang === "en" ? "New tip" : "Nouveau conseil" })}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDynamic ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">
                  {t("valise.aiTipRegenerate", { defaultValue: lang === "en" ? "New tip" : "Nouveau conseil" })}
                </span>
              </button>
            </div>
            <p className={`text-sm text-muted-foreground leading-relaxed transition-opacity ${loadingDynamic ? "opacity-50" : ""}`}>{displayTip}</p>
            {tipError && <p role="status" className="mt-2 text-xs text-warning">{t(tipError === "quota" ? "valise3.tip.quota" : "valise3.tip.error")}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiTipCard;
