import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Globe, Loader2, MessageCircle, Send, X, Sparkles, RotateCcw, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  destination?: string;
  nationality?: string;
  initialOpen?: boolean;
  /** Bumped from parent to force opening the chat (e.g. "Ask Pip" button) */
  openSignal?: number;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

type Stage = "welcome" | "destination" | "nationality" | "tripType" | "duration" | "summary" | "qa";

const STORAGE_KEY = "xplania-visa-pip-v1";

const TRIP_TYPES = [
  { key: "tourism", emoji: "🏖️" },
  { key: "business", emoji: "💼" },
  { key: "studies", emoji: "🎓" },
  { key: "couple", emoji: "👩‍❤️‍👨" },
  { key: "solo", emoji: "🚶‍♀️" },
  { key: "family", emoji: "👨‍👩‍👧" },
] as const;

const DURATIONS = ["lt7", "1to3w", "1to3m", "gt3m"] as const;

const VisaPipChat = ({ destination = "", nationality = "France", initialOpen = false, openSignal = 0 }: Props) => {
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
  const [ctxNat, setCtxNat] = useState(nationality);
  const [ctxTrip, setCtxTrip] = useState<string>("");
  const [ctxDuration, setCtxDuration] = useState<string>("");
  const [destInput, setDestInput] = useState("");
  const [natInput, setNatInput] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setCtxDest(destination); }, [destination]);
  useEffect(() => { setCtxNat(nationality); }, [nationality]);

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
    setCtxTrip("");
    setCtxDuration("");
    setDestInput("");
    setNatInput("");
  };

  const buildSummaryAndGo = useCallback((overrides?: { trip?: string; duration?: string }) => {
    const tripKey = overrides?.trip ?? ctxTrip;
    const durKey = overrides?.duration ?? ctxDuration;
    const tripLabel = tripKey ? t(`guideVisa.chatbot.tripTypes.${tripKey}`) : "";
    const durLabel = durKey ? t(`guideVisa.chatbot.durations.${durKey}`) : "";
    const msg = t("guideVisa.chatbot.summary", {
      destination: ctxDest || (isFr ? "ta destination" : "your destination"),
      nationality: ctxNat || "France",
      duration: durLabel,
      tripType: tripLabel,
    });
    setHistory([{ role: "assistant", content: msg, ts: Date.now() }]);
    setStage("summary");
  }, [ctxDest, ctxNat, ctxTrip, ctxDuration, isFr, t]);

  const askPip = async (q: string) => {
    if (!q.trim() || loading) return;
    const next: ChatMsg[] = [...history, { role: "user", content: q, ts: Date.now() }];
    setHistory(next);
    setQuestion("");
    setLoading(true);
    try {
      const invokePromise = supabase.functions.invoke("visa-qa", {
        body: {
          question: q,
          history: next.slice(-10).map(({ role, content }) => ({ role, content })),
          firstName,
          destination: ctxDest,
          nationality: ctxNat,
          tripType: ctxTrip,
          duration: ctxDuration,
          locale,
        },
      });
      const timeout = new Promise<never>((_, rej) => window.setTimeout(() => rej(new Error("timeout")), 20000));
      const { data, error } = await Promise.race([invokePromise, timeout]);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const answer = typeof data?.answer === "string" && data.answer.trim()
        ? data.answer.trim()
        : t("guideVisa.chatbot.errorAnswer");
      setHistory((prev) => [...prev, { role: "assistant", content: answer, ts: Date.now() }]);
    } catch (e) {
      console.error("visa-qa failed", e);
      setHistory((prev) => [...prev, { role: "assistant", content: t("guideVisa.chatbot.errorAnswer"), ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t("guideVisa.chatbot.openLabel")}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Globe className="w-6 h-6" />
      </button>
    );
  }

  const officialUrl = isFr
    ? "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"
    : "https://www.diplomatie.gouv.fr/en/coming-to-france/";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="fixed bottom-6 right-6 z-50 w-[min(400px,calc(100vw-2rem))] max-h-[85vh] glass-card rounded-2xl shadow-2xl border border-primary/30 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-gradient-to-r from-primary/15 to-secondary/15">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">Pip</p>
              <p className="text-[10px] text-muted-foreground truncate">{t("guideVisa.chatbot.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={restart} aria-label={t("guideVisa.chatbot.restart")} title={t("guideVisa.chatbot.restart")}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={closeChat} aria-label={t("guideVisa.chatbot.close")}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick nav */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/40 overflow-x-auto">
          <button onClick={() => setStage("qa")} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">📋 {t("guideVisa.chatbot.nav.process")}</button>
          <button onClick={() => askPip(isFr ? "Aide-moi à convertir mes devises" : "Help me convert currencies")} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">💱 {t("guideVisa.chatbot.nav.convert")}</button>
          <button onClick={() => askPip(isFr ? `Quels conseils sécurité pour ${ctxDest || "ma destination"} ?` : `Safety tips for ${ctxDest || "my destination"}?`)} className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap">🛡️ {t("guideVisa.chatbot.nav.safety")}</button>
          <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] px-2 py-1 rounded-md hover:bg-primary/10 text-foreground whitespace-nowrap inline-flex items-center gap-1">🏛️ {t("guideVisa.chatbot.nav.embassy")}<ExternalLink className="w-2.5 h-2.5" /></a>
        </div>

        {/* Body */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
          {stage === "welcome" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                {t("guideVisa.chatbot.welcome", { name: firstName })}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setStage(ctxDest ? "nationality" : "destination")}
                  className="flex-1 gradient-button text-primary-foreground text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> {t("guideVisa.chatbot.welcomeYes")}
                </button>
                <button onClick={() => setStage("qa")}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold py-2 px-3 rounded-lg">
                  {t("guideVisa.chatbot.welcomeNo")}
                </button>
              </div>
            </>
          )}

          {stage === "destination" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("guideVisa.chatbot.steps.destination")}</div>
              <form onSubmit={(e) => { e.preventDefault(); if (destInput.trim()) { setCtxDest(destInput.trim()); setStage("nationality"); } }}
                className="flex gap-2">
                <input value={destInput} onChange={(e) => setDestInput(e.target.value)}
                  placeholder={isFr ? "Ex: Thaïlande" : "e.g. Thailand"}
                  className="flex-1 bg-muted/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button type="submit" disabled={!destInput.trim()}
                  className="px-3 py-2 rounded-lg gradient-button text-primary-foreground text-sm font-semibold disabled:opacity-50">
                  →
                </button>
              </form>
            </>
          )}

          {stage === "nationality" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("guideVisa.chatbot.steps.nationality")}</div>
              <form onSubmit={(e) => { e.preventDefault(); if (natInput.trim()) setCtxNat(natInput.trim()); setStage("tripType"); }}
                className="flex gap-2">
                <input value={natInput} onChange={(e) => setNatInput(e.target.value)}
                  placeholder={ctxNat || "France"}
                  className="flex-1 bg-muted/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button type="submit"
                  className="px-3 py-2 rounded-lg gradient-button text-primary-foreground text-sm font-semibold">
                  →
                </button>
              </form>
              <button onClick={() => setStage("tripType")} className="text-xs text-muted-foreground hover:text-foreground underline">
                {isFr ? `Garder ${ctxNat}` : `Keep ${ctxNat}`}
              </button>
            </>
          )}

          {stage === "tripType" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("guideVisa.chatbot.steps.tripType")}</div>
              <div className="grid grid-cols-2 gap-2">
                {TRIP_TYPES.map((tt) => (
                  <button key={tt.key}
                    onClick={() => { setCtxTrip(tt.key); setStage("duration"); }}
                    className="flex items-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg bg-muted hover:bg-primary/15 hover:text-primary transition-colors">
                    <span>{tt.emoji}</span>
                    {t(`guideVisa.chatbot.tripTypes.${tt.key}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {stage === "duration" && (
            <>
              <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{t("guideVisa.chatbot.steps.duration")}</div>
              <div className="grid grid-cols-2 gap-2">
                {DURATIONS.map((d) => (
                  <button key={d}
                    onClick={() => { setCtxDuration(d); setTimeout(buildSummaryAndGo, 0); }}
                    className="text-xs font-semibold py-2 px-2 rounded-lg bg-muted hover:bg-primary/15 hover:text-primary transition-colors">
                    {t(`guideVisa.chatbot.durations.${d}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {(stage === "summary" || stage === "qa") && history.length === 0 && stage === "qa" && (
            <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40">
              {t("guideVisa.chatbot.qaEmpty")}
            </div>
          )}

          {(stage === "summary" || stage === "qa") && history.map((m, i) => (
            <div key={i} className={`text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[92%] whitespace-pre-wrap ${m.role === "user" ? "bg-primary/15 text-foreground ml-auto" : "bg-muted/50 text-foreground"}`}>
              {m.content}
              {m.role === "assistant" && (
                <div className="text-[10px] text-muted-foreground mt-1.5">
                  {t("guideVisa.chatbot.disclaimer")}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t("guideVisa.chatbot.loading")}
            </div>
          )}
        </div>

        {/* Composer (always available) */}
        <form onSubmit={(e) => { e.preventDefault(); if (stage === "welcome") setStage("qa"); askPip(question); }}
          className="p-2 border-t border-border/50 flex items-center gap-2 bg-background/40">
          <input value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("guideVisa.chatbot.placeholder")}
            disabled={loading}
            className="flex-1 bg-muted/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50" />
          <button type="submit" disabled={loading || !question.trim()}
            aria-label={t("guideVisa.chatbot.send")}
            className="w-9 h-9 rounded-lg gradient-button text-primary-foreground flex items-center justify-center disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default VisaPipChat;
