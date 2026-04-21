import { useState } from "react";
import { Camera, MapPin, Star, Pencil, Trash2, Loader2, Smile, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import type { JournalBlock } from "@/hooks/useJournal";
import { toast } from "sonner";

interface Props {
  block: JournalBlock;
  journalId: string;
  destination?: string;
  onChanged: () => void;
}

const MOOD_EMOJIS = ["😢", "😕", "😐", "🙂", "😄"];
const QUICK_EMOJIS = ["✨","🌅","🌊","🍕","🍷","☕","🏖️","🏔️","🚲","🚶","📸","🎨","🎶","💃","🌸","🔥","💖","🌟","🥐","🍜"];

const BlockCard = ({ block, journalId, destination, onChanged }: Props) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState<any>(block.content || {});
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const persist = async (next: any) => {
    setContent(next);
    await supabase.from("journal_blocks").update({ content: next }).eq("id", block.id);
  };

  const save = async () => {
    await supabase.from("journal_blocks").update({ content }).eq("id", block.id);
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    await supabase.from("journal_blocks").delete().eq("id", block.id);
    onChanged();
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${journalId}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("journal-media").upload(path, file);
    if (error) { toast.error("Upload échoué"); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from("journal-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    await persist({ ...content, path, url: signed?.signedUrl, caption: content.caption || "" });
    setUploading(false);
    onChanged();
  };

  const insertEmoji = (emoji: string) => {
    const field = block.type === "highlight" ? "text" : "text";
    const current = content[field] || "";
    setContent({ ...content, [field]: current + emoji });
  };

  const aiEnhance = async () => {
    if (!content.text || content.text.length < 5) {
      toast.error("Écris au moins quelques mots avant d'enrichir avec l'IA");
      return;
    }
    setAiLoading(true);
    try {
      const locale = (localStorage.getItem("xplania-lang") || navigator.language).startsWith("en") ? "en" : "fr";
      const { data, error } = await supabase.functions.invoke("journal-story", {
        body: {
          destination: destination || "",
          days: [{ date: new Date().toISOString().slice(0,10), title: "", blocks: [{ type: block.type, content }] }],
          tone: "poetic",
          mode: "enhance-block",
          rawText: content.text,
          locale,
        },
      });
      if (error) throw error;
      const enhanced = (data?.content || "").trim();
      if (enhanced) {
        const next = { ...content, text: enhanced, ai_enhanced: true };
        setContent(next);
        await supabase.from("journal_blocks").update({ content: next }).eq("id", block.id);
        toast.success("Texte enrichi par l'IA ✨");
        onChanged();
      }
    } catch (e: any) {
      toast.error("Enrichissement IA indisponible");
    } finally {
      setAiLoading(false);
    }
  };

  const renderView = () => {
    switch (block.type) {
      case "note":
        return <p className="text-sm text-foreground whitespace-pre-wrap">{content.text || <span className="text-muted-foreground italic">Note vide…</span>}</p>;
      case "photo":
        return content.url ? (
          <div className="space-y-2">
            <img src={content.url} alt={content.caption || "Souvenir"} className="rounded-lg w-full max-h-96 object-cover" />
            {content.caption && <p className="text-xs text-muted-foreground italic">{content.caption}</p>}
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">Ajouter une photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </label>
        );
      case "location":
        return <div className="flex items-center gap-2 text-sm text-foreground"><MapPin className="w-4 h-4 text-primary" />{content.name || <span className="text-muted-foreground italic">Lieu non défini</span>}</div>;
      case "mood": {
        const idx = typeof content.score === "number" ? content.score - 1 : 2;
        return <div className="flex items-center gap-3"><span className="text-3xl">{MOOD_EMOJIS[idx] ?? "😊"}</span><span className="text-sm text-muted-foreground">{content.score ?? 3}/5</span></div>;
      }
      case "highlight":
        return <div className="flex items-start gap-2"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0 mt-0.5" /><p className="text-sm font-medium text-foreground">{content.text || <span className="text-muted-foreground italic">Décris ton meilleur moment…</span>}</p></div>;
      default:
        return <p className="text-sm text-muted-foreground">{block.type}</p>;
    }
  };

  const renderEdit = () => {
    switch (block.type) {
      case "note":
        return (
          <div className="space-y-2">
            <Textarea value={content.text || ""} onChange={(e) => setContent({ ...content, text: e.target.value })} placeholder="Raconte ta journée…" rows={4} />
            <EmojiAndAi onEmoji={insertEmoji} onAi={aiEnhance} aiLoading={aiLoading} />
          </div>
        );
      case "photo":
        return <Input value={content.caption || ""} onChange={(e) => setContent({ ...content, caption: e.target.value })} placeholder="Légende (optionnel)" />;
      case "location":
        return <Input value={content.name || ""} onChange={(e) => setContent({ ...content, name: e.target.value })} placeholder="Nom du lieu" />;
      case "mood":
        return (
          <div className="flex gap-2 justify-around">
            {MOOD_EMOJIS.map((e, i) => (
              <button key={i} type="button" onClick={() => setContent({ ...content, score: i + 1, emoji: e })}
                className={`text-3xl p-2 rounded-lg transition ${content.score === i + 1 ? "bg-primary/20 scale-110" : "opacity-60 hover:opacity-100"}`}>
                {e}
              </button>
            ))}
          </div>
        );
      case "highlight":
        return (
          <div className="space-y-2">
            <Textarea value={content.text || ""} onChange={(e) => setContent({ ...content, text: e.target.value })} placeholder="Le meilleur moment de cette journée…" rows={3} />
            <EmojiAndAi onEmoji={insertEmoji} onAi={aiEnhance} aiLoading={aiLoading} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 group relative">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
          {block.type}
          {content.ai_enhanced && <Sparkles className="w-3 h-3 text-primary" />}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          {block.type !== "photo" && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(!editing)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={remove}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          {renderEdit()}
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
            <Button size="sm" onClick={save}>Enregistrer</Button>
          </div>
        </div>
      ) : (
        <div onClick={() => block.type !== "photo" && setEditing(true)} className={block.type !== "photo" ? "cursor-text" : ""}>
          {renderView()}
        </div>
      )}
    </motion.div>
  );
};

const EmojiAndAi = ({ onEmoji, onAi, aiLoading }: { onEmoji: (e: string) => void; onAi: () => void; aiLoading: boolean }) => (
  <div className="flex items-center justify-between gap-2">
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="text-xs">
          <Smile className="w-3.5 h-3.5" /> Emoji
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-8 gap-1">
          {QUICK_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => onEmoji(e)} className="text-xl hover:bg-muted rounded p-1 transition">
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
    <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={onAi} disabled={aiLoading}>
      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
      Enrichir IA
    </Button>
  </div>
);

export default BlockCard;
