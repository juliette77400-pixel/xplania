import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Send, X, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Action = "track" | "badges" | "alerts" | "share" | "walk_alone";

interface Props {
  onAction?: (a: Action) => void;
}

interface Msg {
  role: "assistant" | "user";
  content: string;
}

const SOLO_INTENT =
  /\b(seule?|solo|toute?\s+seule?|me\s+promener|alone|by\s+myself|just\s+walk|explorer\s+librement)\b/i;

const SuiviPipChat = ({ onAction }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [history, setHistory] = useState<Msg[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && history.length === 0) {
      setHistory([
        { role: "assistant", content: t("suiviPip.greeting") },
        { role: "assistant", content: t("suiviPip.askIntent") },
      ]);
    }
  }, [open, history.length, t]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  const say = (m: Msg) => setHistory((h) => [...h, m]);

  const pickAction = (a: Action) => {
    say({ role: "user", content: t(`suiviPip.actions.${a}`) });
    setTimeout(() => {
      if (a === "walk_alone") {
        say({ role: "assistant", content: t("suiviPip.soloAck") });
        setTimeout(() => setOpen(false), 1200);
      } else {
        say({ role: "assistant", content: t(`suiviPip.replies.${a}`) });
        onAction?.(a);
      }
    }, 300);
  };

  const handleSend = () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    say({ role: "user", content: v });
    if (SOLO_INTENT.test(v)) {
      setTimeout(() => {
        say({ role: "assistant", content: t("suiviPip.soloAck") });
        setTimeout(() => setOpen(false), 1200);
      }, 300);
      return;
    }
    setTimeout(() => say({ role: "assistant", content: t("suiviPip.fallback") }), 300);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition"
        aria-label="Pip"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed bottom-44 right-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pip</p>
                <p className="text-[10px] text-muted-foreground">{t("suiviPip.subtitle")}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80">
            {history.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-2xl px-3 py-2 max-w-[85%] ${
                  m.role === "assistant"
                    ? "bg-muted/50 text-foreground"
                    : "bg-primary text-primary-foreground ml-auto"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {(["track", "badges", "alerts", "share"] as Action[]).map((a) => (
                <button
                  key={a}
                  onClick={() => pickAction(a)}
                  className="px-2.5 py-1 rounded-full text-xs bg-muted hover:bg-muted/70 border border-border transition"
                >
                  {t(`suiviPip.actions.${a}`)}
                </button>
              ))}
              <button
                onClick={() => pickAction("walk_alone")}
                className="px-2.5 py-1 rounded-full text-xs bg-accent/10 hover:bg-accent/20 border border-accent/30 transition flex items-center gap-1"
              >
                <Footprints className="w-3 h-3" />
                {t("suiviPip.actions.walk_alone")}
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("suiviPip.placeholder")}
                className="h-9 text-sm"
              />
              <Button size="sm" onClick={handleSend} className="h-9 px-3">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuiviPipChat;
