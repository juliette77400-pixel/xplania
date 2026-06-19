import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Sparkles,
  BarChart3,
  Paperclip,
  Share2,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  X,
  Info,
  Plus,
  FileDown,
  Copy,
  Check,
  Pencil,
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { JournalDay } from "@/hooks/useJournal";
import { formatDayLabel } from "@/lib/journal-utils";

const STORAGE_KEY = "xplania-carnet-onboarded-v1";
const QA_HISTORY_PREFIX = "xplania-carnet-qa-history";

type Section = "timeline" | "story" | "insights" | "docs" | "share";

interface ChatMsg { role: "user" | "assistant"; content: string; ts: number }

interface Props {
  tripId: string;
  journalId?: string;
  journalTitle?: string;
  destination: string;
  days: JournalDay[];
  activeSection: Section;
  activeDay?: JournalDay | null;
  hasStory?: boolean;
  isPublic?: boolean;
  tripEnded?: boolean;
  departureDate?: string | null;
  returnDate?: string | null;
  onSuggestFocus?: (focus: Section) => void;
  onChanged?: () => void;
}

const CarnetOnboardingChat = ({
  tripId,
  journalId,
  journalTitle,
  destination,
  days,
  activeSection,
  activeDay,
  hasStory,
  isPublic,
  tripEnded,
  departureDate,
  returnDate,
  onSuggestFocus,
  onChanged,
}: Props) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!user?.id) { setProfileName(""); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        if (!cancelled && data?.display_name) setProfileName(data.display_name as string);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const firstName = (() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      meta.first_name, meta.firstName, meta.given_name,
      typeof meta.full_name === "string" ? (meta.full_name as string).split(" ")[0] : undefined,
      typeof meta.name === "string" ? (meta.name as string).split(" ")[0] : undefined,
      typeof meta.display_name === "string" ? (meta.display_name as string).split(" ")[0] : undefined,
      profileName ? profileName.split(" ")[0] : undefined,
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
    return localStorage.getItem("xplania-carnet-chat-expanded") === "1";
  });
  const [mode, setMode] = useState<"guided" | "qa">("guided");
  const [stage, setStage] = useState<"welcome" | "suggestion">("welcome");
  const [question, setQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<ChatMsg[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [insertingIdx, setInsertingIdx] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [payloadCopied, setPayloadCopied] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const locale: "fr" | "en" = i18n.language.startsWith("en") ? "en" : "fr";
  // Persist conversation per trip AND per active tab so each section keeps its own thread
  const qaStorageKey = `${QA_HISTORY_PREFIX}::${tripId}::${activeSection}`;
  const triggerKey = `${tripId}::${activeSection}`;

  // Aggregated context (shared by inspector + edge function payload)
  const ctx = (() => {
    const totalBlocks = days.reduce((s, d) => s + (d.blocks?.length || 0), 0);
    const filledDays = days.filter((d) => (d.blocks?.length || 0) > 0).length;
    const blocksByType: Record<string, number> = {};
    const locationsSet = new Set<string>();
    const moods: string[] = [];
    const blocksDetail: Array<{ day: string; type: string; preview: string }> = [];
    for (const d of days) {
      const dayLabel = formatDayLabel(d.date);
      for (const b of d.blocks || []) {
        blocksByType[b.type] = (blocksByType[b.type] || 0) + 1;
        const c = (b.content || {}) as Record<string, unknown>;
        if (b.type === "location" && typeof c.name === "string") locationsSet.add(c.name);
        if (b.type === "mood" && typeof c.label === "string") moods.push(c.label);
        const preview =
          (typeof c.text === "string" && c.text) ||
          (typeof c.name === "string" && c.name) ||
          (typeof c.label === "string" && c.label) ||
          (typeof c.title === "string" && c.title) ||
          "";
        blocksDetail.push({
          day: dayLabel,
          type: b.type,
          preview: String(preview).slice(0, 80),
        });
      }
    }
    return {
      totalBlocks, filledDays,
      blocksByType,
      locations: Array.from(locationsSet),
      moods,
      blocksDetail,
    };
  })();

  // Payload that will be (or was) sent to the edge function — shown in the context inspector
  const inspectablePayload = {
    firstName,
    destination,
    days: days.length,
    filledDays: ctx.filledDays,
    totalBlocks: ctx.totalBlocks,
    blocksByType: ctx.blocksByType,
    blocks: ctx.blocksDetail,
    locations: ctx.locations,
    moods: ctx.moods,
    activeSection,
    activeDayLabel: activeDay ? formatDayLabel(activeDay.date) : "",
    activeDayBlocks: activeDay?.blocks?.length || 0,
    hasStory: !!hasStory,
    isPublic: !!isPublic,
    tripEnded: !!tripEnded,
    departureDate: departureDate || "",
    returnDate: returnDate || "",
    locale,
  };

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(inspectablePayload, null, 2));
      setPayloadCopied(true);
      toast.success(t("carnet.qa.payloadCopied"));
      setTimeout(() => setPayloadCopied(false), 1500);
    } catch {
      toast.error(t("carnet.qa.payloadCopyFail"));
    }
  };

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try { localStorage.setItem("xplania-carnet-chat-expanded", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };

  const focusOptions: Section[] = ["timeline", "story", "insights", "docs", "share"];
  const focusIcons = {
    timeline: BookOpen,
    story: Sparkles,
    insights: BarChart3,
    docs: Paperclip,
    share: Share2,
  } as const;

  useEffect(() => {
    const key = `${STORAGE_KEY}::${triggerKey}`;
    const seen = typeof window !== "undefined" && localStorage.getItem(key);
    if (!seen) {
      const timer = setTimeout(() => {
        setOpen(true); setMode("guided"); setStage("welcome");
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setOpen(true); setStage("suggestion");
    }
  }, [triggerKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(qaStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setQaHistory(parsed.slice(-30));
      } else setQaHistory([]);
    } catch { /* ignore */ }
  }, [qaStorageKey]);

  useEffect(() => {
    try { localStorage.setItem(qaStorageKey, JSON.stringify(qaHistory.slice(-30))); } catch { /* ignore */ }
  }, [qaHistory, qaStorageKey]);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [qaHistory, qaLoading, mode]);

  useEffect(() => {
    if (mode !== "qa") return;
    if (qaHistory.length > 0) return;
    const variants = t("carnet.qa.greetings", { returnObjects: true }) as unknown;
    const list = Array.isArray(variants) && variants.length > 0
      ? (variants as string[])
      : [t(firstName ? "carnet.qa.greeting" : "carnet.qa.greetingNoName", { name: firstName, destination })];
    const pick = list[Math.floor(Math.random() * list.length)];
    const filled = pick
      .replace(/\{\{\s*name\s*\}\}/g, firstName || "")
      .replace(/\{\{\s*destination\s*\}\}/g, destination || "")
      .replace(/\s{2,}/g, " ").replace(/\s+([,!?.])/g, "$1").trim();
    setQaHistory([{ role: "assistant", content: filled, ts: Date.now() }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, firstName, destination]);

  const closeBubble = () => {
    setOpen(false);
    try { localStorage.setItem(`${STORAGE_KEY}::${triggerKey}`, "1"); } catch { /* ignore */ }
  };

  const handleYes = () => { setStage("suggestion"); onSuggestFocus?.("timeline"); };
  const handleNo = () => closeBubble();

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
        days: days.length,
        filledDays: ctx.filledDays,
        totalBlocks: ctx.totalBlocks,
        blocksByType: ctx.blocksByType,
        moods: ctx.moods,
        locations: ctx.locations,
        activeSection,
        activeDayLabel: activeDay ? formatDayLabel(activeDay.date) : "",
        activeDayBlocks: activeDay?.blocks?.length || 0,
        hasStory: !!hasStory,
        isPublic: !!isPublic,
        tripEnded: !!tripEnded,
        departureDate: departureDate || "",
        returnDate: returnDate || "",
        locale,
      };
      const invokePromise = supabase.functions.invoke("carnet-qa", { body: payload });
      const timeoutPromise = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("qa_timeout")), 20000)
      );
      const { data, error: fnError } = await Promise.race([invokePromise, timeoutPromise]);
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const answer = typeof data?.answer === "string" && data.answer.trim()
        ? data.answer.trim()
        : t("carnet.qa.errorAnswer");
      setQaHistory((prev) => [...prev, { role: "assistant", content: answer, ts: Date.now() }]);
    } catch (e) {
      console.error("carnet-qa failed", e);
      setQaHistory((prev) => [
        ...prev,
        { role: "assistant", content: t("carnet.qa.errorAnswer"), ts: Date.now() },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  const handleInsert = async (idx: number, content: string) => {
    if (!user || !content.trim()) return;
    setInsertingIdx(idx);
    try {
      if (activeSection === "story" && journalId) {
        const { error } = await supabase.from("journal_stories").insert({
          journal_id: journalId,
          user_id: user.id,
          tone: "chat",
          content,
        });
        if (error) throw error;
        toast.success(t("carnet.qa.insertedStory"));
      } else {
        // Default: insert as a note block on the active (or first) day
        const targetDay = activeDay || days[0];
        if (!targetDay || !journalId) {
          toast.error(t("carnet.qa.insertNoDay"));
          return;
        }
        const nextPos = (targetDay.blocks?.length || 0);
        const { error } = await supabase.from("journal_blocks").insert({
          day_id: targetDay.id,
          journal_id: journalId,
          user_id: user.id,
          type: "note",
          content: { text: content },
          position: nextPos,
        });
        if (error) throw error;
        toast.success(t("carnet.qa.insertedNote", { day: formatDayLabel(targetDay.date) }));
      }
      onChanged?.();
    } catch (e: any) {
      console.error("insert failed", e);
      toast.error(e?.message || t("carnet.qa.insertFail"));
    } finally {
      setInsertingIdx(null);
    }
  };

  const handleExportPdf = () => {
    if (qaHistory.length === 0) {
      toast.error(t("carnet.qa.exportEmpty"));
      return;
    }
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(journalTitle || destination || t("carnet.onboarding.title"), margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        `${t("carnet.qa.exportTab")}: ${t(`carnet.onboarding.sectionLabel.${activeSection}`)} • ${new Date().toLocaleString()}`,
        margin, y,
      );
      y += 8;
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      doc.setTextColor(0);

      for (const m of qaHistory) {
        const who = m.role === "user" ? t("carnet.qa.you") : "Pip";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${who}`, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(m.content, pageW - margin * 2);
        for (const line of lines) {
          if (y > pageH - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 5;
        }
        y += 3;
      }

      const safeTitle = (journalTitle || destination || "carnet").replace(/[^a-z0-9-]+/gi, "_").slice(0, 40);
      doc.save(`chat-${safeTitle}-${activeSection}.pdf`);
      toast.success(t("carnet.qa.exportDone"));
    } catch (e) {
      console.error("export pdf failed", e);
      toast.error(t("carnet.qa.exportFail"));
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t("carnet.onboarding.title")}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full gradient-button text-primary-foreground shadow-2xl flex items-center justify-center hover:opacity-90"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  const currentHelp = t(`carnet.onboarding.sectionHelp.${activeSection}`, { destination, days: days.length });

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
            <span className="text-sm font-bold text-foreground">{t("carnet.onboarding.title")}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode(mode === "guided" ? "qa" : "guided")}
              className="text-[11px] font-semibold px-2 py-1 rounded-md bg-primary/15 hover:bg-primary/25 text-primary"
            >
              {mode === "guided" ? t("carnet.qa.askButton") : t("carnet.qa.backToGuide")}
            </button>
            {mode === "qa" && (
              <>
                <button
                  aria-label={t("carnet.qa.contextLabel")}
                  title={t("carnet.qa.contextLabel")}
                  onClick={() => setShowContext((s) => !s)}
                  className={`p-1 rounded-md hover:bg-muted ${showContext ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Info className="w-4 h-4" />
                </button>
                <button
                  aria-label={t("carnet.qa.exportPdf")}
                  title={t("carnet.qa.exportPdf")}
                  onClick={handleExportPdf}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <FileDown className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              aria-label={expanded ? t("carnet.qa.collapse") : t("carnet.qa.expand")}
              title={expanded ? t("carnet.qa.collapse") : t("carnet.qa.expand")}
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
                  {t("carnet.onboarding.welcome", { destination, days: days.length })}
                </p>
                <p className="text-sm text-muted-foreground">{t("carnet.onboarding.question")}</p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={handleYes}
                    className="flex-1 gradient-button text-primary-foreground text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("carnet.onboarding.yes")}
                  </button>
                  <button
                    onClick={handleNo}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold py-2 px-3 rounded-lg"
                  >
                    {t("carnet.onboarding.no")}
                  </button>
                </div>
              </>
            )}

            {stage === "suggestion" && (
              <>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {t(`carnet.onboarding.sectionLabel.${activeSection}`)}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{currentHelp}</p>
                <div className="grid grid-cols-2 gap-2">
                  {focusOptions.map((focus) => {
                    const Icon = focusIcons[focus];
                    return (
                      <button
                        key={focus}
                        onClick={() => onSuggestFocus?.(focus)}
                        className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg ${activeSection === focus ? "bg-primary/20 text-primary" : "bg-muted hover:bg-muted/80 text-foreground"}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t(`carnet.onboarding.focus.${focus}`)}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setMode("qa")}
                  className="w-full gradient-button text-primary-foreground text-sm font-semibold py-2 px-3 rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t("carnet.qa.askButton")}
                </button>
              </>
            )}
          </div>
        )}

        {mode === "qa" && (
          <>
            {showContext && (
              <div className="border-b border-border/40 bg-muted/30 px-3 py-2 text-[11px] text-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Info className="w-3 h-3" /> {t("carnet.qa.contextTitle")}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-muted-foreground">
                  <div><span className="text-foreground font-medium">{t("carnet.qa.ctxDestination")}:</span> {destination || "—"}</div>
                  <div><span className="text-foreground font-medium">{t("carnet.qa.ctxTab")}:</span> {t(`carnet.onboarding.focus.${activeSection}`)}</div>
                  <div><span className="text-foreground font-medium">{t("carnet.qa.ctxDays")}:</span> {ctx.filledDays}/{days.length}</div>
                  <div><span className="text-foreground font-medium">{t("carnet.qa.ctxBlocks")}:</span> {ctx.totalBlocks}</div>
                  <div className="col-span-2"><span className="text-foreground font-medium">{t("carnet.qa.ctxActiveDay")}:</span> {activeDay ? `${formatDayLabel(activeDay.date)} (${activeDay.blocks?.length || 0})` : "—"}</div>
                  <div className="col-span-2"><span className="text-foreground font-medium">{t("carnet.qa.ctxTypes")}:</span> {Object.entries(ctx.blocksByType).map(([k,v])=>`${k}:${v}`).join(", ") || "—"}</div>
                  <div className="col-span-2"><span className="text-foreground font-medium">{t("carnet.qa.ctxLocations")}:</span> {ctx.locations.slice(0,6).join(", ") || "—"}</div>
                  <div className="col-span-2"><span className="text-foreground font-medium">{t("carnet.qa.ctxMoods")}:</span> {ctx.moods.slice(-6).join(", ") || "—"}</div>
                </div>
                {ctx.blocksDetail.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <div className="text-foreground font-medium mb-1">{t("carnet.qa.ctxBlocksDetail")} ({ctx.blocksDetail.length})</div>
                    <div className="max-h-28 overflow-y-auto space-y-0.5 pr-1">
                      {ctx.blocksDetail.slice(0, 40).map((b, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground">
                          <span className="text-primary font-mono">[{b.type}]</span> <span className="text-foreground">{b.day}</span>
                          {b.preview ? <span> · {b.preview}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={copyPayload}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-primary/15 hover:bg-primary/25 text-primary"
                  >
                    {payloadCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {payloadCopied ? t("carnet.qa.payloadCopied") : t("carnet.qa.copyPayload")}
                  </button>
                </div>
              </div>
            )}
            <div
              ref={scrollerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[180px]"
            >
              {qaHistory.length === 0 && !qaLoading && (
                <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40">
                  {t("carnet.qa.emptyState", { destination })}
                </div>
              )}
              {qaHistory.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[90%] whitespace-pre-wrap ${m.role === "user" ? "bg-primary/15 text-foreground" : "bg-muted/50 text-foreground"}`}
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" && i > 0 && (
                    <button
                      onClick={() => handleInsert(i, m.content)}
                      disabled={insertingIdx === i}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
                      title={t("carnet.qa.insertHint")}
                    >
                      {insertingIdx === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      {activeSection === "story"
                        ? t("carnet.qa.insertStory")
                        : t("carnet.qa.insertNote", { section: t(`carnet.onboarding.focus.${activeSection}`) })}
                    </button>
                  )}
                </div>
              ))}
              {qaLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("carnet.qa.loading")}
                </div>
              )}
            </div>


            <form
              onSubmit={(e) => { e.preventDefault(); askQuestion(); }}
              className="p-2 border-t border-border/50 flex items-center gap-2 bg-background/40"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("carnet.qa.placeholder")}
                disabled={qaLoading}
                className="flex-1 bg-muted/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={qaLoading || !question.trim()}
                className="w-9 h-9 rounded-lg gradient-button text-primary-foreground flex items-center justify-center disabled:opacity-50"
                aria-label={t("carnet.qa.send")}
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

export default CarnetOnboardingChat;
