import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecommendInput } from "@/hooks/useMoodExplorer";
import type { MoodKey } from "@/lib/moods";

interface Props {
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: RecommendInput) => void | Promise<void>;
}

type MoodTag =
  | "calme"
  | "stress"
  | "emerveillement"
  | "connexion"
  | "energie"
  | "contemplatif"
  | "curiosite_fatiguee";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

type Step = "mood" | "company" | "duration" | "ready";

// Map internal mood-tag → existing MoodKey (so the existing mood-recommend
// edge function keeps working without breaking anything).
const MOOD_MAP: Record<MoodTag, MoodKey> = {
  calme: "chill",
  contemplatif: "chill",
  curiosite_fatiguee: "chill",
  emerveillement: "explore",
  connexion: "party",
  energie: "party",
  stress: "nature",
};

const SOLO_INTENT = /\b(seule?|solo|toute?\s+seule?|me\s+promener|marcher\s+seul|just\s+a\s+walk|alone|by\s+myself)\b/i;

const MOOD_TAGS: MoodTag[] = [
  "calme",
  "stress",
  "emerveillement",
  "connexion",
  "energie",
  "contemplatif",
  "curiosite_fatiguee",
];

const MOOD_EMOJI: Record<MoodTag, string> = {
  calme: "🌿",
  stress: "😣",
  emerveillement: "✨",
  connexion: "🤝",
  energie: "🎉",
  contemplatif: "🤔",
  curiosite_fatiguee: "😴",
};

const COMPANIES = ["solo", "duo", "group", "family"] as const;
const DURATIONS = ["30m", "1h", "half", "full"] as const;

const MoodPipChat = ({ loading, onClose, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("mood");
  const [mood, setMood] = useState<MoodTag | null>(null);
  const [freeInput, setFreeInput] = useState("");
  const [company, setCompany] = useState<(typeof COMPANIES)[number] | null>(null);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number] | null>(null);
  const [text, setText] = useState("");
  const [history, setHistory] = useState<ChatMsg[]>([
    { role: "assistant", content: t("moodComp.pip.greeting") },
  ]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [history, step]);

  const say = (msg: ChatMsg) => setHistory((h) => [...h, msg]);

  // Solo intent shortcut — can fire at any moment
  const handleFreeText = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    say({ role: "user", content: trimmed });
    setText("");

    if (SOLO_INTENT.test(trimmed)) {
      say({ role: "assistant", content: t("moodComp.pip.soloDetected") });
      // Skip to ready with solo defaults
      setMood("calme");
      setCompany("solo");
      setDuration("1h");
      setFreeInput(trimmed);
      setStep("ready");
      return;
    }

    // Treat as free-form mood description
    setFreeInput(trimmed);
    setMood("calme"); // sensible default; free_input dominates the AI prompt
    say({ role: "assistant", content: t("moodComp.pip.gotFree") });
    setStep("company");
  };

  const pickMood = (m: MoodTag) => {
    setMood(m);
    say({ role: "user", content: `${MOOD_EMOJI[m]} ${t(`moodComp.pip.tags.${m}`)}` });
    say({ role: "assistant", content: t("moodComp.pip.askCompany") });
    setStep("company");
  };

  const pickCompany = (c: (typeof COMPANIES)[number]) => {
    setCompany(c);
    say({ role: "user", content: t(`moodComp.pip.company.${c}`) });
    say({ role: "assistant", content: t("moodComp.pip.askDuration") });
    setStep("duration");
  };

  const pickDuration = (d: (typeof DURATIONS)[number]) => {
    setDuration(d);
    say({ role: "user", content: t(`moodComp.pip.duration.${d}`) });
    say({ role: "assistant", content: t("moodComp.pip.recap") });
    setStep("ready");
  };

  const generate = () => {
    if (!mood) return;
    const moodKey = MOOD_MAP[mood];
    const energyMap: Record<MoodTag, number> = {
      calme: 25, stress: 35, contemplatif: 30, curiosite_fatiguee: 40,
      emerveillement: 65, connexion: 70, energie: 90,
    };
    const ctxParts = [
      freeInput,
      company ? `companion: ${company}` : "",
      duration ? `duration: ${duration}` : "",
    ].filter(Boolean);
    onSubmit({
      mood: moodKey,
      free_input: ctxParts.join(" | ") || undefined,
      energy_level: energyMap[mood],
    });
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card to-card/60 shadow-xl overflow-hidden flex flex-col max-h-[70vh]">
      <header className="flex items-center justify-between p-3 border-b border-border/60 bg-gradient-to-r from-primary/15 to-secondary/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold">Pip</p>
            <p className="text-[10px] text-muted-foreground">{t("moodComp.pip.subtitle")}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label={t("moodComp.pip.close")}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {history.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted/60 text-foreground rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("moodComp.pip.thinking")}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border/60 space-y-3 bg-card/40">
        {step === "mood" && (
          <div className="flex flex-wrap gap-1.5">
            {MOOD_TAGS.map((m) => (
              <button
                key={m}
                onClick={() => pickMood(m)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card/60 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                {MOOD_EMOJI[m]} {t(`moodComp.pip.tags.${m}`)}
              </button>
            ))}
          </div>
        )}

        {step === "company" && (
          <div className="flex flex-wrap gap-1.5">
            {COMPANIES.map((c) => (
              <button
                key={c}
                onClick={() => pickCompany(c)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card/60 hover:border-primary/50 transition-colors"
              >
                {t(`moodComp.pip.company.${c}`)}
              </button>
            ))}
          </div>
        )}

        {step === "duration" && (
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => pickDuration(d)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card/60 hover:border-primary/50 transition-colors"
              >
                {t(`moodComp.pip.duration.${d}`)}
              </button>
            ))}
          </div>
        )}

        {step === "ready" && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={loading} className="flex-1">
              <Sparkles className="w-4 h-4 mr-1.5" />
              {t("moodComp.pip.generate")}
            </Button>
            <Button variant="ghost" onClick={() => setStep("mood")} disabled={loading}>
              {t("moodComp.pip.adjust")}
            </Button>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); handleFreeText(text); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("moodComp.pip.placeholder")}
            className="flex-1 text-sm px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/50 focus:outline-none"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={!text.trim()}>
            {t("moodComp.pip.send")}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MoodPipChat;
