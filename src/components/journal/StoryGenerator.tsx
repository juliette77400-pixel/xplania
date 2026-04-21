import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, Wand2, PenLine, Save } from "lucide-react";
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

type Mode = "ai" | "manual";

const StoryGenerator = ({ journalId, destination, days, initialTone, onSaved }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("ai");
  const [tone, setTone] = useState(initialTone || "storytelling");
  const [story, setStory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    setStory("");
    try {
      const locale = (typeof navigator !== "undefined" && (localStorage.getItem("xplania-lang") || navigator.language).startsWith("en")) ? "en" : "fr";
      const { data, error } = await supabase.functions.invoke("journal-story", {
        body: { destination, days, tone, locale },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const content = data?.content || "";
      setStory(content);
      if (content && user) {
        await supabase.from("journal_stories").insert({ journal_id: journalId, user_id: user.id, tone, content });
        await supabase.from("journals").update({ tone }).eq("id", journalId);
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
    if (!user || !story.trim()) {
      toast.error(t("j2.writeBefore"));
      return;
    }
    setSaving(true);
    try {
      await supabase.from("journal_stories").insert({
        journal_id: journalId,
        user_id: user.id,
        tone: "manual",
        content: story,
      });
      onSaved();
      toast.success(t("j2.storySaved"));
    } catch (e: any) {
      toast.error(t("j2.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">{t("j2.storyTitle")}</h3>
        </div>

        <div className="flex gap-1 p-1 rounded-lg bg-muted/40">
          <button
            onClick={() => setMode("ai")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${mode === "ai" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles className="w-3.5 h-3.5" /> {t("j2.modeAi")}
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${mode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <PenLine className="w-3.5 h-3.5" /> {t("j2.modeManual")}
          </button>
        </div>
      </div>

      {mode === "ai" ? (
        <>
          <p className="text-sm text-muted-foreground">{t("j2.aiHint")}</p>
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
      ) : (
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

      {story && mode === "ai" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-muted/30 border border-border">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-serif">{story}</p>
        </motion.div>
      )}
    </div>
  );
};

export default StoryGenerator;
