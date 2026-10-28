// Reusable page assistant (same look as the Budget chat): side panel on a computer, bottom sheet
// on a phone. Opened from the page's own button or "Aide" → "Poser une question" (help-events);
// it has no floating launcher, so it never stacks on the "Aide" button.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { onOpenPipChat } from "@/lib/help-events";
import { chatErrorReply } from "@/lib/ai-pause";
import type { QuotaTool } from "@/lib/usage-quota";
import { AssistantQuotaNote, AssistantSuggestions } from "./AssistantExtras";

interface Msg { role: "user" | "assistant"; content: string; failed?: boolean }

export interface ToolAssistantProps {
  /** Backend assistant ("culture" | "housing"). */
  tool: "culture" | "housing";
  quotaTool: QuotaTool;
  title: string;
  greeting: string;
  suggestions: string[];
  /** What the page shows right now; read when a question is sent. */
  context: () => Record<string, unknown>;
  /** Bumped by the page's own button to open the panel. */
  openSignal?: number;
}

export default function ToolAssistant({ tool, quotaTool, title, greeting, suggestions, context, openSignal = 0 }: ToolAssistantProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("en") ? "en" : "fr";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Msg[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);

  useEffect(() => { if (openSignal > 0) setOpen(true); }, [openSignal]);
  useEffect(() => onOpenPipChat(() => setOpen(true)), []);
  useEffect(() => { if (open) window.setTimeout(() => input.current?.focus(), 50); }, [open]);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [history, loading]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (raw: string, base: Msg[] = history) => {
    const q = raw.trim();
    // A ref, not only state: two quick clicks never send two questions (or use two tries).
    if (!q || busy.current) return;
    busy.current = true;
    const next: Msg[] = [...base, { role: "user", content: q }];
    setHistory(next);
    setQuestion("");
    setLoading(true);
    try {
      const call = supabase.functions.invoke("tool-assistant", {
        body: { tool, question: q, locale, history: next.slice(-9, -1).filter((m) => !m.failed).map(({ role, content }) => ({ role, content })), ...context() },
      });
      const timeout = new Promise<never>((_, rej) => window.setTimeout(() => rej(new Error("timeout")), 45000));
      const { data, error } = await Promise.race([call, timeout]);
      if ((error as { context?: { status?: number } } | null)?.context?.status === 402) {
        setHistory((h) => [...h, { role: "assistant", content: t("assistant.quotaReached"), failed: true }]);
        return;
      }
      if (error || !data?.answer) throw error ?? new Error("no_answer");
      setHistory((h) => [...h, { role: "assistant", content: String(data.answer) }]);
      qc.invalidateQueries({ queryKey: ["quota"] });
    } catch (e) {
      setHistory((h) => [...h, { role: "assistant", content: chatErrorReply(e, t("assistant.error")), failed: true }]);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  /** Sends the last question again, without the failed answer. */
  const retry = () => {
    const lastUser = [...history].reverse().findIndex((m) => m.role === "user");
    if (lastUser < 0) return;
    const idx = history.length - 1 - lastUser;
    void ask(history[idx].content, history.slice(0, idx));
  };

  if (!open) return null;
  const last = history[history.length - 1];

  return (
    <div role="dialog" aria-modal="false" aria-label={title}
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-t-2xl border border-primary/30 glass-card shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-20 sm:max-h-none sm:w-[400px] sm:rounded-2xl">
      <div className="flex items-center justify-between border-b border-border/50 bg-primary/10 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="gradient-button flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><MessageCircle className="h-4 w-4 text-primary-foreground" aria-hidden /></div>
          <p className="truncate text-sm font-bold text-foreground">{title}</p>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button type="button" onClick={() => setHistory([])} disabled={loading} aria-label={t("assistant.restart")} title={t("assistant.restart")} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
          )}
          <button type="button" onClick={() => setOpen(false)} aria-label={t("common.close")} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div ref={scroller} className="min-h-[160px] flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed text-foreground">{greeting}</div>
        {history.length === 0 && <AssistantSuggestions items={suggestions} onPick={(q) => void ask(q)} disabled={loading} />}
        {history.map((m, i) => (
          <div key={i} className={`max-w-[92%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "ml-auto bg-primary/15 text-foreground" : m.failed ? "border border-destructive/30 bg-destructive/5 text-foreground" : "bg-muted/50 text-foreground"}`}>
            {m.content}
          </div>
        ))}
        {loading && <p role="status" className="flex items-center gap-2 p-1 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />{t("assistant.thinking")}</p>}
        {!loading && last?.failed && last.content !== t("assistant.quotaReached") && (
          <button type="button" onClick={retry} className="rounded-full border border-border px-3 py-1 text-xs text-foreground hover:bg-muted/60">{t("common.retry")}</button>
        )}
      </div>

      <div className="space-y-1.5 border-t border-border/50 bg-background/40 p-2">
        <form onSubmit={(e) => { e.preventDefault(); void ask(question); }} className="flex items-center gap-2">
          <input ref={input} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={600} disabled={loading}
            placeholder={t("assistant.placeholder")} aria-label={t("assistant.placeholder")}
            className="flex-1 rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50" />
          <button type="submit" disabled={loading || !question.trim()} aria-label={t("assistant.send")}
            className="gradient-button flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground disabled:opacity-50">
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
        <AssistantQuotaNote tool={quotaTool} />
      </div>
    </div>
  );
}
