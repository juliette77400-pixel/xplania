import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Backpack, Loader2, Send, X, Sparkles, RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  destination?: string;
  initialOpen?: boolean;
  openSignal?: number;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

type Stage =
  | "welcome"
  | "destination"
  | "dates"
  | "luggage"
  | "tripType"
  | "activities"
  | "duration"
  | "summary"
  | "qa";

const STORAGE_KEY = "xplania-valise-pip-v1";
const SEEN_KEY = "xplania-valise-pip-seen-v1";
const CHAT_KIND = "valise";

interface PersistedState {
  history: ChatMsg[];
  stage: Stage;
  ctx: {
    dest: string;
    start: string;
    end: string;
    luggage: string;
    trip: string;
    activities: string[];
    duration: string;
  };
  updatedAt: number;
}

function readLocalState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || !Array.isArray(parsed.history)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalState(state: PersistedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* */ }
}

const LUGGAGES = [
  { key: "backpack", emoji: "🎒" },
  { key: "cabin", emoji: "🧳" },
  { key: "large", emoji: "🧳" },
  { key: "sport", emoji: "👜" },
  { key: "both", emoji: "🎒🧳" },
] as const;

const TRIP_TYPES = [
  { key: "beach", emoji: "🏖️" },
  { key: "mountain", emoji: "🏔️" },
  { key: "city", emoji: "🏙️" },
  { key: "nature", emoji: "🌿" },
  { key: "business", emoji: "💼" },
  { key: "long", emoji: "🎓" },
  { key: "solo", emoji: "🚶‍♀️" },
  { key: "couple", emoji: "👩‍❤️‍👨" },
  { key: "family", emoji: "👨‍👩‍👧" },
] as const;

const ACTIVITIES = [
  { key: "swim", emoji: "🏊" },
  { key: "hike", emoji: "🥾" },
  { key: "food", emoji: "🍽️" },
  { key: "culture", emoji: "🏛️" },
  { key: "nightlife", emoji: "🎉" },
  { key: "sport", emoji: "🏋️" },
  { key: "photo", emoji: "📸" },
  { key: "remote", emoji: "💻" },
] as const;

const DURATIONS = ["lt3d", "3to7d", "1to2w", "2to4w", "gt1m"] as const;

function daysBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : null;
}

const ValisePipChat = ({ destination = "", initialOpen = false, openSignal = 0 }: Props) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale: "fr" | "en" = i18n.language.startsWith("en") ? "en" : "fr";
  const isFr = locale === "fr";

  const firstName = (() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      meta.first_name, meta.firstName, meta.given_name,
      typeof meta.full_name === "string" ? (meta.full_name as string).split(" ")[0] : undefined,
      typeof meta.name === "string" ? (meta.name as string).split(" ")[0] : undefined,
      user?.email ? user.email.split("@")[0] : undefined,
    ];
    const found = candidates.find((v) => typeof v === "string" && v.trim().length > 0) as string | undefined;
    if (!found) return "";
    const clean = found.trim().replace(/[._-]+/g, " ").split(" ")[0];
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  })();

  const [open, setOpen] = useState(initialOpen);
  const [stage, setStage] = useState<Stage>("welcome");

  const [ctxDest, setCtxDest] = useState(destination);
  const [ctxStart, setCtxStart] = useState<string>("");
  const [ctxEnd, setCtxEnd] = useState<string>("");
  const [ctxLuggage, setCtxLuggage] = useState<string>("");
  const [ctxTrip, setCtxTrip] = useState<string>("");
  const [ctxActivities, setCtxActivities] = useState<string[]>([]);
  const [ctxDuration, setCtxDuration] = useState<string>("");

  const [destInput, setDestInput] = useState("");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setCtxDest(destination); }, [destination]);

  useEffect(() => {
    if (openSignal > 0) {
      setOpen(true);
      setStage((s) => (s === "welcome" ? "qa" : s));
    }
  }, [openSignal]);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [history, loading, stage]);

  const closeChat = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* */ }
  };

  const restart = () => {
    setStage("welcome");
    setHistory([]);
    setCtxStart(""); setCtxEnd(""); setCtxLuggage(""); setCtxTrip("");
    setCtxActivities([]); setCtxDuration("");
    setDestInput(""); setStartInput(""); setEndInput("");
  };

  const toggleActivity = (key: string) => {
    setCtxActivities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const buildSummaryAndGo = useCallback((overrides?: { duration?: string }) => {
    const durKey = overrides?.duration ?? ctxDuration;
    const computed = daysBetween(ctxStart, ctxEnd);
    const durationLabel = computed
      ? t("valise.chatbot.computedDays", { count: computed })
      : (durKey ? t(`valise.chatbot.durations.${durKey}`) : "");
    const luggageLabel = ctxLuggage ? t(`valise.chatbot.luggages.${ctxLuggage}`) : "";
    const tripLabel = ctxTrip ? t(`valise.chatbot.tripTypes.${ctxTrip}`) : "";
    const actsLabel = ctxActivities.length
      ? ctxActivities.map((k) => t(`valise.chatbot.activities.${k}`)).join(", ")
      : (isFr ? "aucune précisée" : "none specified");

    const msg = t("valise.chatbot.summary", {
      destination: ctxDest || (isFr ? "ta destination" : "your destination"),
      duration: durationLabel || (isFr ? "non précisée" : "not specified"),
      luggage: luggageLabel,
      tripType: tripLabel,
      activities: actsLabel,
    });
    setHistory([{ role: "assistant", content: msg, ts: Date.now() }]);
    setStage("summary");
  }, [ctxDest, ctxStart, ctxEnd, ctxLuggage, ctxTrip, ctxActivities, ctxDuration, isFr, t]);

  const askPip = async (q: string) => {
    if (!q.trim() || loading) return;
    const next: ChatMsg[] = [...history, { role: "user", content: q, ts: Date.now() }];
    setHistory(next);
    setQuestion("");
    setLoading(true);
    try {
      const invokePromise = supabase.functions.invoke("valise-qa", {
        body: {
          question: q,
          history: next.slice(-10).map(({ role, content }) => ({ role, content })),
          firstName,
          destination: ctxDest,
          startDate: ctxStart,
          endDate: ctxEnd,
          luggage: ctxLuggage,
          tripType: ctxTrip,
          activities: ctxActivities,
          duration: ctxDuration,
          locale,
        },
      });
      const timeout = new Promise<never>((_, rej) => window.setTimeout(() => rej(new Error("timeout")), 25000));
      const { data, error } = await Promise.race([invokePromise, timeout]);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const answer = typeof data?.answer === "string" && data.answer.trim()
        ? data.answer.trim()
        : t("valise.chatbot.errorAnswer");
      setHistory((prev) => [...prev, { role: "assistant", content: answer, ts: Date.now() }]);
    } catch (e) {
      console.error("valise-qa failed", e);
      setHistory((prev) => [...prev, { role: "assistant", content: t("valise.chatbot.errorAnswer"), ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t("valise.chatbot.openLabel")}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Backpack className="w-6 h-6" />
      </button>
    );
  }

  const scrollToId = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-2rem))] max-h-[85vh] glass-card rounded-2xl shadow-2xl border border-primary/30 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-gradient-to-r from-primary/15 to-secondary/15">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              <Backpack className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">Pip</p>
              <p className="text-[10px] text-muted-foreground truncate">{t("valise.chatbot.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={restart} aria-label={t("valise.chatbot.restart")} title={t("valise.chatbot.restart")}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={closeChat} aria-label={t("valise.chatbot.close")}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick nav */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/40 overflow-x-auto">
          <button onClick={() => askPip(isFr ? `Donne-moi un résumé météo pour ${ctxDest || "ma destination"} pendant mes dates.` : `Give me a weather summary for ${ctxDest || "my destination"} during my dates.`)} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">🌤️ {t("valise.chatbot.nav.weather")}</button>
          <button onClick={() => askPip(isFr ? `Propose-moi une liste de packing complète pour ce voyage.` : `Suggest a complete packing list for this trip.`)} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">🧴 {t("valise.chatbot.nav.list")}</button>
          <button onClick={() => askPip(isFr ? `Donne-moi 3 idées de tenues complètes pour ce voyage.` : `Give me 3 complete outfit ideas for this trip.`)} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">👗 {t("valise.chatbot.nav.outfits")}</button>
          <button onClick={() => askPip(isFr ? `Tes meilleurs conseils packing variés et précis pour mon contexte.` : `Your best varied and precise packing tips for my context.`)} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">🤖 {t("valise.chatbot.nav.tips")}</button>
          <button onClick={() => askPip(isFr ? `Conseils culturels précis pour ${ctxDest || "ma destination"} (dress code, coutumes, mots utiles).` : `Precise cultural tips for ${ctxDest || "my destination"} (dress code, customs, useful words).`)} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">🌍 {t("valise.chatbot.nav.culture")}</button>
          <button onClick={() => scrollToId("weather-section")} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">🔄 {t("valise.chatbot.nav.adapt")}</button>
        </div>

        {/* Body */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[220px]">
          {stage === "welcome" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                {t("valise.chatbot.welcome", { name: firstName })}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setStage(ctxDest ? "dates" : "destination")}
                  className="flex-1 gradient-button text-primary-foreground text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> {t("valise.chatbot.welcomeYes")}
                </button>
                <button onClick={() => setStage("qa")}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold py-2 px-3 rounded-lg">
                  {t("valise.chatbot.welcomeNo")}
                </button>
              </div>
            </>
          )}

          {stage === "destination" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("valise.chatbot.steps.destination")}</div>
              <form onSubmit={(e) => { e.preventDefault(); if (destInput.trim()) { setCtxDest(destInput.trim()); setStage("dates"); } }}
                className="flex gap-2">
                <input value={destInput} onChange={(e) => setDestInput(e.target.value)}
                  placeholder={isFr ? "Ex: Lisbonne" : "e.g. Lisbon"}
                  className="flex-1 bg-muted/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button type="submit" disabled={!destInput.trim()}
                  className="px-3 py-2 rounded-lg gradient-button text-primary-foreground text-sm font-semibold disabled:opacity-50">
                  →
                </button>
              </form>
            </>
          )}

          {stage === "dates" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("valise.chatbot.steps.dates")}</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCtxStart(startInput);
                  setCtxEnd(endInput);
                  setStage("luggage");
                }}
                className="space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={startInput} onChange={(e) => setStartInput(e.target.value)}
                    className="bg-muted/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input type="date" value={endInput} onChange={(e) => setEndInput(e.target.value)}
                    className="bg-muted/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="flex gap-2">
                  <button type="submit"
                    className="flex-1 px-3 py-2 rounded-lg gradient-button text-primary-foreground text-sm font-semibold">
                    {t("valise.chatbot.next")}
                  </button>
                  <button type="button" onClick={() => setStage("luggage")}
                    className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm">
                    {t("valise.chatbot.skip")}
                  </button>
                </div>
              </form>
            </>
          )}

          {stage === "luggage" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("valise.chatbot.steps.luggage")}</div>
              <div className="grid grid-cols-2 gap-2">
                {LUGGAGES.map((l) => (
                  <button key={l.key}
                    onClick={() => { setCtxLuggage(l.key); setStage("tripType"); }}
                    className="flex items-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg bg-muted hover:bg-primary/15 hover:text-primary transition-colors">
                    <span>{l.emoji}</span>
                    {t(`valise.chatbot.luggages.${l.key}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {stage === "tripType" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("valise.chatbot.steps.tripType")}</div>
              <div className="grid grid-cols-2 gap-2">
                {TRIP_TYPES.map((tt) => (
                  <button key={tt.key}
                    onClick={() => { setCtxTrip(tt.key); setStage("activities"); }}
                    className="flex items-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg bg-muted hover:bg-primary/15 hover:text-primary transition-colors">
                    <span>{tt.emoji}</span>
                    {t(`valise.chatbot.tripTypes.${tt.key}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {stage === "activities" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("valise.chatbot.steps.activities")}</div>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITIES.map((a) => {
                  const active = ctxActivities.includes(a.key);
                  return (
                    <button key={a.key}
                      onClick={() => toggleActivity(a.key)}
                      className={`flex items-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg transition-colors ${active ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted hover:bg-primary/15"}`}>
                      <span>{a.emoji}</span>
                      {t(`valise.chatbot.activities.${a.key}`)}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  const computed = daysBetween(ctxStart, ctxEnd);
                  if (computed) {
                    buildSummaryAndGo();
                  } else {
                    setStage("duration");
                  }
                }}
                className="w-full px-3 py-2 rounded-lg gradient-button text-primary-foreground text-sm font-semibold">
                {t("valise.chatbot.next")}
              </button>
            </>
          )}

          {stage === "duration" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("valise.chatbot.steps.duration")}</div>
              <div className="grid grid-cols-2 gap-2">
                {DURATIONS.map((d) => (
                  <button key={d}
                    onClick={() => { setCtxDuration(d); buildSummaryAndGo({ duration: d }); }}
                    className="text-xs font-semibold py-2 px-2 rounded-lg bg-muted hover:bg-primary/15 hover:text-primary transition-colors">
                    {t(`valise.chatbot.durations.${d}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {(stage === "summary" || stage === "qa") && history.length === 0 && stage === "qa" && (
            <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40">
              {t("valise.chatbot.qaEmpty")}
            </div>
          )}

          {(stage === "summary" || stage === "qa") && history.map((m, i) => (
            <div key={i} className={`text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[92%] whitespace-pre-wrap ${m.role === "user" ? "bg-primary/15 text-foreground ml-auto" : "bg-muted/50 text-foreground"}`}>
              {m.content}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t("valise.chatbot.loading")}
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={(e) => { e.preventDefault(); if (stage === "welcome") setStage("qa"); askPip(question); }}
          className="p-2 border-t border-border/50 flex items-center gap-2 bg-background/40">
          <input value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("valise.chatbot.placeholder")}
            disabled={loading}
            className="flex-1 bg-muted/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50" />
          <button type="submit" disabled={loading || !question.trim()}
            aria-label={t("valise.chatbot.send")}
            className="w-9 h-9 rounded-lg gradient-button text-primary-foreground flex items-center justify-center disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default ValisePipChat;
