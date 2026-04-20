import { useState } from "react";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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

const StoryGenerator = ({ journalId, destination, days, initialTone, onSaved }: Props) => {
  const { user } = useAuth();
  const [tone, setTone] = useState(initialTone || "storytelling");
  const [story, setStory] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setStory("");
    try {
      const { data, error } = await supabase.functions.invoke("journal-story", {
        body: { destination, days, tone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const content = data?.content || "";
      setStory(content);

      if (content && user) {
        await supabase.from("journal_stories").insert({
          journal_id: journalId,
          user_id: user.id,
          tone,
          content,
        });
        await supabase.from("journals").update({ tone }).eq("id", journalId);
        onSaved();
      }
    } catch (e: any) {
      toast.error(e.message || "Génération impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Récit immersif par IA</h3>
      </div>
      <p className="text-sm text-muted-foreground">Transforme tes souvenirs en récit captivant.</p>

      <div className="flex gap-2">
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TONES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label} <span className="text-xs text-muted-foreground">— {t.desc}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Générer
        </Button>
      </div>

      {story && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-muted/30 border border-border"
        >
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-serif">{story}</p>
        </motion.div>
      )}
    </div>
  );
};

export default StoryGenerator;
