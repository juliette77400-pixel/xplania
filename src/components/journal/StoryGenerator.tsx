import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, Wand2, PenLine, Save, UserRound, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TONES } from "@/lib/journal-utils";
import { toast } from "sonner";
import type { JournalDay } from "@/hooks/useJournal";

interface Props {
  journalId: string;
  destination: string;
  days: JournalDay[];
  initialTone: string;
  onSaved: () => void;
}

type Mode = "ai-tone" | "ai-auto" | "manual";

const StoryGenerator = ({ journalId, destination, days, initialTone, onSaved }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("ai-tone");
  const [tone, setTone] = useState(initialTone && initialTone !== "auto" ? initialTone : "storytelling");
  const [story, setStory] = useState<string>("");
  const [usedMode, setUsedMode] = useState<"tone" | "auto" | "manual" | null>(null);
  const [usedTone, setUsedTone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    setStory("");
    try {
      const locale = (typeof navigator !== "undefined" && (localStorage.getItem("xplania-lang") || navigator.language).startsWith("en")) ? "en" : "fr";
      let styleProfile: any = null;
      let effectiveTone = tone;
      let effectiveMode: "tone" | "auto" = "tone";

      if (mode === "ai-auto") {
        const { data: sp } = await supabase.functions.invoke("journal-style-profile", {
          body: { journalId, locale },
        });
        styleProfile = (sp as any)?.profile || null;
        if (!styleProfile) {
          toast.message(t("j2.styleNotEnough"));
          // fall back to tone but flag
        } else {
          effectiveTone = "auto";
          effectiveMode = "auto";
        }
      }

      const { data, error } = await supabase.functions.invoke("journal-story", {
        body: { destination, days, tone: effectiveTone, locale, styleProfile, mode: effectiveMode === "auto" ? "auto" : undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const content = (data as any)?.content || "";
      setStory(content);
      setUsedMode(effectiveMode);
      setUsedTone(effectiveTone);
      if (content && user) {
        await supabase.from("journal_stories").insert({
          journal_id: journalId,
          user_id: user.id,
          tone: effectiveMode === "auto" ? "auto" : effectiveTone,
          content,
        });
        await supabase.from("journals").update({ tone: effectiveMode === "auto" ? "auto" : effectiveTone }).eq("id", journalId);
        onSaved();
        toast.success(t("j2.storyGenerated"));
      }
    } catch (e: any) {
      toast.error(e.message || t("j2.genFail"));
    } finally {
      setLoading(false);
    }
  };

  const saveManual = async () => {
    if (!user || !story.trim()) { toast.error(t("j2.writeBefore")); return; }
    setSaving(true);
    try {
      await supabase.from("journal_stories").insert({
        journal_id: journalId, user_id: user.id, tone: "manual", content: story,
      });
      setUsedMode("manual");
      onSaved();
      toast.success(t("j2.storySaved"));
    } catch { toast.error(t("j2.saveError")); }
    finally { setSaving(false); }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">{t("j2.storyTitle")}</h3>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted/40 text-xs">
          <ModeBtn active={mode === "ai-tone"} onClick={() => setMode("ai-tone")} icon={<Palette className="w-3.5 h-3.5" />} label={t("j2.modeAiTone")} />
          <ModeBtn active={mode === "ai-auto"} onClick={() => setMode("ai-auto")} icon={<UserRound className="w-3.5 h-3.5" />} label={t("j2.modeAiAuto")} />
          <ModeBtn active={mode === "manual"} onClick={() => setMode("manual")} icon={<PenLine className="w-3.5 h-3.5" />} label={t("j2.modeManual")} />
        </div>
      </div>

      {mode === "ai-tone" && (
        <>
          <p className="text-sm text-muted-foreground">{t("j2.aiToneHint")}</p>
          <div className="flex gap-2">
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((tn) => (
                  <SelectItem key={tn.value} value={tn.value}>
                    {tn.label} <span className="text-xs text-muted-foreground">— {tn.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t("j2.generate")}
            </Button>
          </div>
        </>
      )}

      {mode === "ai-auto" && (
        <>
          <p className="text-sm text-muted-foreground">{t("j2.aiAutoHint")}</p>
          <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t("j2.generateMyStyle")}
          </Button>
        </>
      )}

      {mode === "manual" && (
        <>
          <p className="text-sm text-muted-foreground">{t("j2.manualHint")}</p>
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder={t("j2.manualPlaceholder")}
            rows={12}
            className="font-serif leading-relaxed"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{t("j2.wordsCount", { n: story.split(/\s+/).filter(Boolean).length })}</span>
            <Button onClick={saveManual} disabled={saving || !story.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t("j2.saveBtn")}
            </Button>
          </div>
        </>
      )}

      {story && mode !== "manual" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
          {usedMode && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold flex items-center gap-1">
                {usedMode === "auto" ? <><UserRound className="w-3 h-3" /> {t("j2.usedAuto")}</> : <><Palette className="w-3 h-3" /> {t("j2.usedTone", { tone: usedTone })}</>}
              </span>
            </div>
          )}
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-serif">{story}</p>
        </motion.div>
      )}
    </div>
  );
};

const ModeBtn = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
    {icon} {label}
  </button>
);

export default StoryGenerator;
