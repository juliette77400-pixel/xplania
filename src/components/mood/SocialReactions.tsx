import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMoodReactions } from "@/hooks/useMoodSocial";
import { MOODS, moodByKey } from "@/lib/moods";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { MoodPlace } from "@/hooks/useMoodExplorer";

interface Props {
  place: MoodPlace;
  onShared?: () => void;
}

const EMOJIS = ["❤️", "😍", "🔥", "🌟", "🌿", "✨", "🎶", "☕"];

const SocialReactions = ({ place, onShared }: Props) => {
  const { reactions, addReaction } = useMoodReactions(place.id);
  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>(place.mood);
  const [emoji, setEmoji] = useState<string>("✨");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    const res = await addReaction({
      mood: selectedMood,
      emoji,
      comment: comment.trim() || undefined,
      lat: place.lat,
      lng: place.lng,
      place_name: place.name,
    });
    setSending(false);
    if (res) {
      setComment("");
      setOpen(false);
      onShared?.();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageCircle className="w-4 h-4 text-primary" />
          People felt this here ({reactions.length})
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? "Annuler" : "Partager mon ressenti"}
        </Button>
      </div>

      {open && (
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-3 space-y-3 animate-fade-in">
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Ton mood ici</div>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMood(m.key)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    selectedMood === m.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background/40 border-border hover:border-primary/40"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Emoji</div>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg border text-lg transition-all ${
                    emoji === e ? "bg-primary/20 border-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Décris en une phrase ce que tu as ressenti ici…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            rows={2}
            className="resize-none"
          />

          <Button onClick={submit} disabled={sending} className="w-full" size="sm">
            <Send className="w-4 h-4 mr-2" /> Publier mon ressenti
          </Button>
        </div>
      )}

      {reactions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-3">
          Sois le premier à partager ton ressenti ici ✨
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {reactions.map((r) => {
            const m = moodByKey(r.mood);
            return (
              <div key={r.id} className="rounded-lg border border-border bg-background/40 p-2.5 text-sm flex gap-2">
                <span className="text-2xl shrink-0">{r.emoji || m?.emoji || "✨"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{m?.label || r.mood}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}</span>
                  </div>
                  {r.comment && <p className="text-foreground/90 mt-0.5">{r.comment}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SocialReactions;
