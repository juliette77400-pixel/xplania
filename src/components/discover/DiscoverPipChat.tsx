import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Send, X, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DiscoverEntrySlug, DiscoverSelection } from "./DiscoverEntry";

interface Props {
  onClose: () => void;
  onSubmit: (selection: DiscoverSelection) => void;
  hasActiveTrip?: boolean;
}

type Step = "category" | "company" | "distance" | "ready";

interface Msg {
  role: "assistant" | "user";
  content: string;
}

const SOLO_INTENT =
  /\b(seule?|solo|toute?\s+seule?|me\s+promener|marcher\s+seul[e]?|just(\s+a)?\s+walk|alone|by\s+myself|j['e\s]+ai\s+juste\s+besoin\s+de\s+marcher)\b/i;

const CATS: DiscoverEntrySlug[] = [
  "gastronomie",
  "nature",
  "culture",
  "vie_nocturne",
  "shopping",
  "sport",
  "bien_etre",
  "pepites",
  "tout",
];

const CAT_EMOJI: Record<DiscoverEntrySlug, string> = {
  gastronomie: "🍽️",
  nature: "🌳",
  culture: "🏛️",
  vie_nocturne: "🌙",
  shopping: "🛍️",
  sport: "🏃",
  bien_etre: "🧘",
  pepites: "💎",
  tout: "🔍",
};

const COMPANIES = ["solo", "duo", "group", "family"] as const;
const DISTANCES = ["close", "medium", "any"] as const;

const DiscoverPipChat = ({ onClose, onSubmit, hasActiveTrip }: Props) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("category");
  const [picked, setPicked] = useState<DiscoverEntrySlug[]>([]);
  const [company, setCompany] = useState<(typeof COMPANIES)[number] | null>(null);
  const [distance, setDistance] = useState<(typeof DISTANCES)[number] | null>(null);
  const [text, setText] = useState("");
  const [history, setHistory] = useState<Msg[]>(() => [
    { role: "assistant", content: t("discoverPip.greeting") },
    { role: "assistant", content: t("discoverPip.askCategory") },
  ]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  const say = (msg: Msg) => setHistory((h) => [...h, msg]);

  const handleSoloIntent = () => {
    say({ role: "assistant", content: t("discoverPip.soloAck") });
    setTimeout(() => onSubmit({ slugs: ["pepites", "tout"], mode: "solo_shortcut" }), 600);
  };

  const detectIntent = (raw: string) => {
    if (SOLO_INTENT.test(raw)) {
      handleSoloIntent();
      return true;
    }
    return false;
  };

  const submitText = () => {
    const v = text.trim();
    if (!v) return;
    say({ role: "user", content: v });
    setText("");
    if (detectIntent(v)) return;
    // Generic fallback: nudge towards chips
    say({ role: "assistant", content: t("discoverPip.fallback") });
  };

  const togglePick = (slug: DiscoverEntrySlug) => {
    setPicked((prev) => {
      if (slug === "tout") return prev.includes("tout") ? [] : ["tout"];
      const next = prev.filter((s) => s !== "tout");
      return next.includes(slug) ? next.filter((s) => s !== slug) : [...next, slug];
    });
  };

  const confirmCategory = () => {
    if (picked.length === 0) return;
    const labels = picked.map((s) => `${CAT_EMOJI[s]} ${t(`discoverEntry.cat.${s}`)}`).join(", ");
    say({ role: "user", content: labels });
    say({ role: "assistant", content: t("discoverPip.askCompany") });
    setStep("company");
  };

  const pickCompany = (c: (typeof COMPANIES)[number]) => {
    setCompany(c);
    say({ role: "user", content: t(`discoverPip.company.${c}`) });
    say({ role: "assistant", content: t("discoverPip.askDistance") });
    setStep("distance");
  };

  const pickDistance = (d: (typeof DISTANCES)[number]) => {
    setDistance(d);
    say({ role: "user", content: t(`discoverPip.distance.${d}`) });
    say({
      role: "assistant",
      content: t("discoverPip.recap", {
        cats: picked.map((s) => t(`discoverEntry.cat.${s}`)).join(", "),
      }),
    });
    setStep("ready");
  };

  const launch = () => {
    onSubmit({ slugs: picked, mode: "chatbot" });
  };

  const back = () => {
    if (step === "company") setStep("category");
    else if (step === "distance") setStep("company");
    else if (step === "ready") setStep("distance");
  };

  const chips = useMemo(() => CATS, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("discoverPip.title")}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center"
    >
      <div className="flex h-[90vh] w-full max-w-xl flex-col rounded-t-3xl border border-border bg-card shadow-2xl sm:h-[80vh] sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">{t("discoverPip.title")}</p>
              <p className="text-xs text-muted-foreground">
                {hasActiveTrip ? t("discoverPip.activeTrip") : t("discoverPip.aroundYou")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {history.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {step === "category" && (
            <div className="flex flex-wrap gap-2 pt-2">
              {chips.map((s) => {
                const on = picked.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => togglePick(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      on
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {CAT_EMOJI[s]} {t(`discoverEntry.cat.${s}`)}
                  </button>
                );
              })}
            </div>
          )}

          {step === "company" && (
            <div className="flex flex-wrap gap-2 pt-2">
              {COMPANIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickCompany(c)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                >
                  {t(`discoverPip.company.${c}`)}
                </button>
              ))}
            </div>
          )}

          {step === "distance" && (
            <div className="flex flex-wrap gap-2 pt-2">
              {DISTANCES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDistance(d)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                >
                  {t(`discoverPip.distance.${d}`)}
                </button>
              ))}
            </div>
          )}

          {step === "ready" && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={launch} className="gap-2 rounded-full">
                <Sparkles className="h-4 w-4" />
                {t("discoverPip.showResults")}
              </Button>
              <Button variant="ghost" onClick={back} className="rounded-full">
                {t("discoverPip.adjust")}
              </Button>
            </div>
          )}
        </div>

        <footer className="space-y-2 border-t border-border/60 px-4 py-3">
          {step === "category" && picked.length > 0 && (
            <div className="flex justify-end">
              <Button size="sm" onClick={confirmCategory} className="rounded-full">
                {t("discoverPip.confirmCategory", { count: picked.length })}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitText()}
              placeholder={t("discoverPip.inputPh")}
              aria-label={t("discoverPip.inputPh")}
              className="rounded-full"
            />
            <Button size="icon" onClick={submitText} aria-label={t("common.send")}>
              <Send className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSoloIntent}
              aria-label={t("discoverEntry.soloShortcut")}
              title={t("discoverEntry.soloShortcut")}
            >
              <Footprints className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DiscoverPipChat;
