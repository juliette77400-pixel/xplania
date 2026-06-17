import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  LineChart,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  PiggyBank,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { BudgetCategory } from "./BudgetForecast";
import type { Expense } from "./AddExpenseForm";
import type { TravelFormData } from "@/types/travel";

const STORAGE_KEY = "xplania-budget-onboarded-v1";
const QA_HISTORY_PREFIX = "xplania-budget-qa-history";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface Props {
  destination: string;
  days: number;
  travelers: number;
  totalBudget: number;
  categories: BudgetCategory[];
  expenses: Expense[];
  tripData?: TravelFormData | null;
  /** Bumped on each regenerate to re-trigger onboarding */
  triggerKey: string | number;
  activeSection: "analysis" | "forecast" | "tracker" | "charts" | "tips";
  isGenerating?: boolean;
  onRegenerate?: () => void;
  onSuggestFocus?: (focus: "analysis" | "forecast" | "tracker" | "charts" | "tips") => void;
}

const BudgetOnboardingChat = ({
  destination,
  days,
  travelers,
  totalBudget,
  categories,
  expenses,
  tripData,
  triggerKey,
  activeSection,
  isGenerating,
  onRegenerate,
  onSuggestFocus,
}: Props) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const firstName = (() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      meta.first_name,
      meta.firstName,
      meta.given_name,
      typeof meta.full_name === "string" ? (meta.full_name as string).split(" ")[0] : undefined,
      typeof meta.name === "string" ? (meta.name as string).split(" ")[0] : undefined,
      user?.email ? user.email.split("@")[0] : undefined,
    ];
    const found = candidates.find((v) => typeof v === "string" && v.trim().length > 0) as string | undefined;
    if (!found) return "";
    const clean = found.trim().replace(/[._-]+/g, " ").split(" ")[0];
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  })();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("xplania-budget-chat-expanded") === "1";
  });
  const [mode, setMode] = useState<"guided" | "qa">("guided");
  const [stage, setStage] = useState<"welcome" | "suggestion">("welcome");
  const [question, setQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<ChatMsg[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const locale: "fr" | "en" = i18n.language.startsWith("en") ? "en" : "fr";
  const qaStorageKey = `${QA_HISTORY_PREFIX}::${destination}`;

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("xplania-budget-chat-expanded", next ? "1" : "0");
      } catch { /* ignore */ }
      return next;
    });
  };

  const focusOptions = ["analysis", "forecast", "tracker", "charts", "tips"] as const;
  const focusIcons = {
    analysis: Target,
    forecast: PiggyBank,
    tracker: BarChart3,
    charts: LineChart,
    tips: Sparkles,
  } as const;

  useEffect(() => {
    const key = `${STORAGE_KEY}::${triggerKey}`;
    const seen = typeof window !== "undefined" && localStorage.getItem(key);
    if (!seen) {
      const timer = setTimeout(() => {
        setOpen(true);
        setMode("guided");
        setStage("welcome");
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setOpen(true);
      setStage("suggestion");
    }
  }, [triggerKey]);

  // Load persisted Q&A history (survives inactivity / remounts)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(qaStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setQaHistory(parsed.slice(-30));
      } else {
        setQaHistory([]);
      }
    } catch {
      /* ignore */
    }
  }, [qaStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(qaStorageKey, JSON.stringify(qaHistory.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [qaHistory, qaStorageKey]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [qaHistory, qaLoading, mode]);

  // Seed Pip's personalized greeting when entering QA mode with empty history
  useEffect(() => {
    if (mode !== "qa") return;
    if (qaHistory.length > 0) return;
    const greeting = firstName
      ? t("budget.qa.greeting", { name: firstName, destination })
      : t("budget.qa.greetingNoName", { destination });
    setQaHistory([{ role: "assistant", content: greeting, ts: Date.now() }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const closeBubble = () => {
    setOpen(false);
    try {
      localStorage.setItem(`${STORAGE_KEY}::${triggerKey}`, "1");
    } catch {
      /* ignore */
    }
  };

  const handleYes = () => {
    setStage("suggestion");
    onSuggestFocus?.("forecast");
  };

  const handleNo = () => {
    closeBubble();
  };

  const askQuestion = async () => {
    const q = question.trim();
    if (!q || qaLoading) return;
    const now = Date.now();
    const nextHistory: ChatMsg[] = [...qaHistory, { role: "user", content: q, ts: now }];
    setQaHistory(nextHistory);
    setQuestion("");
    setQaLoading(true);
    try {
      const payload = {
        question: q,
        history: nextHistory.slice(-10).map(({ role, content }) => ({ role, content })),
        firstName,
        destination,
        totalBudget,
        days,
        travelers,
        locale,
        categories: categories.map((c) => ({ key: c.key, planned: c.planned, spent: c.spent })),
        expenses: expenses.map((e) => ({ amount: e.amount, category: e.category, label: (e as { label?: string }).label, date: (e as { date?: string }).date })),
        departureDate: tripData?.departureDate || "",
        returnDate: tripData?.returnDate || "",
        tripTypes: tripData?.tripTypes || [],
        spendingPriorities: tripData?.spendingPriorities || [],
        accommodationStanding: tripData?.accommodationStanding || "",
        organization: tripData?.organization || "",
        rhythm: tripData?.rhythm || "",
      };
      const invokePromise = supabase.functions.invoke("budget-qa", { body: payload });
      const timeoutPromise = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("qa_timeout")), 20000)
      );
      const { data, error: fnError } = await Promise.race([invokePromise, timeoutPromise]);
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const answer = typeof data?.answer === "string" && data.answer.trim()
        ? data.answer.trim()
        : t("budget.qa.errorAnswer");
      setQaHistory((prev) => [...prev, { role: "assistant", content: answer, ts: Date.now() }]);
    } catch (e) {
      console.error("budget-qa failed", e);
      setQaHistory((prev) => [
        ...prev,
        { role: "assistant", content: t("budget.qa.errorAnswer"), ts: Date.now() },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t("budget.onboarding.title")}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full gradient-button text-primary-foreground shadow-2xl flex items-center justify-center hover:opacity-90"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  const currentHelp = t(`budget.onboarding.sectionHelp.${activeSection}`, { destination, days });

  const panelClass = expanded
    ? "fixed inset-x-2 bottom-2 top-2 sm:inset-auto sm:bottom-6 sm:right-6 sm:top-[10vh] sm:w-[min(560px,calc(100vw-3rem))] sm:max-h-[80vh] z-50 glass-card rounded-2xl shadow-2xl border border-primary/30 overflow-hidden flex flex-col"
    : "fixed bottom-6 right-6 z-50 w-[min(380px,calc(100vw-2rem))] glass-card rounded-2xl shadow-2xl border border-primary/30 overflow-hidden flex flex-col max-h-[80vh]";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className={panelClass}
      >
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-button flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">{t("budget.onboarding.title")}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode(mode === "guided" ? "qa" : "guided")}
              className="text-[11px] font-semibold px-2 py-1 rounded-md bg-primary/15 hover:bg-primary/25 text-primary"
            >
              {mode === "guided" ? t("budget.qa.askButton") : t("budget.qa.backToGuide")}
            </button>
            <button
              aria-label={expanded ? t("budget.qa.collapse") : t("budget.qa.expand")}
              title={expanded ? t("budget.qa.collapse") : t("budget.qa.expand")}
              onClick={toggleExpanded}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              aria-label={t("common.close")}
              onClick={closeBubble}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {mode === "guided" && (
          <div className="p-4 space-y-3 overflow-y-auto">
            {stage === "welcome" && (
              <>
                <p className="text-sm text-foreground leading-relaxed">
                  {t("budget.onboarding.welcome", { destination, days })}
                </p>
                <p className="text-sm text-muted-foreground">{t("budget.onboarding.question")}</p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={handleYes}
                    className="flex-1 gradient-button text-primary-foreground text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("budget.onboarding.yes")}
                  </button>
                  <button
                    onClick={handleNo}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
                  >
                    {t("budget.onboarding.no")}
                  </button>
                </div>
              </>
            )}

            {stage === "suggestion" && (
              <>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {t(`budget.onboarding.sectionLabel.${activeSection}`)}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{currentHelp}</p>
                <div className="grid grid-cols-2 gap-2">
                  {focusOptions.map((focus) => {
                    const Icon = focusIcons[focus];
                    return (
                      <button
                        key={focus}
                        onClick={() => onSuggestFocus?.(focus)}
                        className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg transition-colors ${activeSection === focus ? "bg-primary/20 text-primary" : "bg-muted hover:bg-muted/80 text-foreground"}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t(`budget.onboarding.focus.${focus}`)}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  className="w-full bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                  {t("budget.onboarding.regenerate")}
                </button>
                <button
                  onClick={() => setMode("qa")}
                  className="w-full gradient-button text-primary-foreground text-sm font-semibold py-2 px-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t("budget.qa.askButton")}
                </button>
              </>
            )}
          </div>
        )}

        {mode === "qa" && (
          <>
            <div
              ref={scrollerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[180px]"
            >
              {qaHistory.length === 0 && !qaLoading && (
                <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40">
                  {t("budget.qa.emptyState", { destination })}
                </div>
              )}
              {qaHistory.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[90%] whitespace-pre-wrap ${m.role === "user" ? "bg-primary/15 text-foreground ml-auto" : "bg-muted/50 text-foreground"}`}
                >
                  {m.content}
                </div>
              ))}
              {qaLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("budget.qa.loading")}
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                askQuestion();
              }}
              className="p-2 border-t border-border/50 flex items-center gap-2 bg-background/40"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("budget.qa.placeholder")}
                disabled={qaLoading}
                className="flex-1 bg-muted/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={qaLoading || !question.trim()}
                className="w-9 h-9 rounded-lg gradient-button text-primary-foreground flex items-center justify-center disabled:opacity-50"
                aria-label={t("budget.qa.send")}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default BudgetOnboardingChat;
