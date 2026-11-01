import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lightbulb, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { isAiPause } from "@/lib/ai-pause";
import { loadAiResult, saveAiResult } from "@/lib/data/trip-ai-results";
import { useActiveTrip } from "@/stores/useActiveTrip";
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

// Tips are saved with the trip (device + account), one per profile, stay
// facts and language. Reopening the page or another device shows the saved
// tip; a profile or language without a saved tip shows the written tip of
// that profile. The AI is called on its own only for the very first tip of a
// trip; after that, only the "New tip" button calls it.
type SavedTips = { tips: Record<string, { title: string; tip: string }> };
const MAX_SAVED_TIPS = 12;

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

  const tripId = useActiveTrip((s) => s.tripId);
  const scope = tripId || `no-trip::${(destination || "").toLowerCase().trim()}`;
  const savedRef = useRef<SavedTips["tips"] | null>(null);
  const [savedReady, setSavedReady] = useState(false);
  const [dynamicTip, setDynamicTip] = useState<{ title: string; tip: string } | null>(null);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [tipError, setTipError] = useState<"quota" | "pause" | "error" | null>(null);
  const inFlightRef = useRef(false);
  const shownRef = useRef<string[]>([]);
  const topicRef = useRef(Math.floor(Math.random() * TOPICS_FR.length));

  const fetchTip = useCallback(
    async (force = false) => {
      if (inFlightRef.current) return;
      if (!force) {
        const saved = savedRef.current?.[cacheKey];
        if (saved) {
          setDynamicTip(saved);
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
          setTipError(isAiPause(error) ? "pause" : status === 402 ? "quota" : "error");
          return;
        }
        const answer = (data as { answer?: string } | null)?.answer || "";
        const parsed = parseTip(answer, staticTitle);
        if (parsed.tip) {
          setDynamicTip(parsed);
          shownRef.current = [...shownRef.current, parsed.title].slice(-10);
          const kept = Object.entries({ ...(savedRef.current || {}) }).filter(([k]) => k !== cacheKey).slice(-(MAX_SAVED_TIPS - 1));
          savedRef.current = Object.fromEntries([...kept, [cacheKey, parsed]]);
          saveAiResult<SavedTips>(scope, tripId, "valise_tip", { tips: savedRef.current }, cacheKey, lang);
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
    [cacheKey, destination, lang, mode, staticTitle, profileLabel, months, actKey, stayType, transport, days, climate, scope, tripId],
  );

  // Saved tips of this trip, from the device or the account.
  useEffect(() => {
    let alive = true;
    setSavedReady(false);
    void loadAiResult<SavedTips>(scope, tripId, "valise_tip").then((r) => {
      if (!alive) return;
      savedRef.current = r?.content?.tips && typeof r.content.tips === "object" ? r.content.tips : null;
      setSavedReady(true);
    });
    return () => { alive = false; };
  }, [scope, tripId]);

  // Profile, stay or language change: saved tip, else the written tip. Never a new AI call on its own,
  // except for the very first tip of the trip.
  useEffect(() => {
    if (!savedReady) return;
    const saved = savedRef.current?.[cacheKey];
    if (saved) { setDynamicTip(saved); return; }
    setDynamicTip(null);
    const neverGenerated = !savedRef.current || Object.keys(savedRef.current).length === 0;
    if (neverGenerated && destination) void fetchTip(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, savedReady]);

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
            {tipError && <p role="status" className="mt-2 text-xs text-warning">{t(tipError === "quota" ? "valise3.tip.quota" : tipError === "pause" ? "valise3.tip.pause" : "valise3.tip.error")}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiTipCard;
