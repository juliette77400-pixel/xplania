import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Msg {
  role: "user" | "assistant";
  content: string;
  cta?: { label: string; route: string } | null;
  intent?: string;
}

const HIDE_ROUTES = ["/auth", "/onboarding"];

const GlobalPipChat = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [freeMode, setFreeMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [msgs, open]);

  if (HIDE_ROUTES.some((p) => loc.pathname.startsWith(p))) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const locale = (localStorage.getItem("xplania-lang") || navigator.language).startsWith("en") ? "en" : "fr";
      const { data, error } = await supabase.functions.invoke("pip-router", {
        body: {
          message: text,
          locale,
          history: msgs.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        },
      });
      if (error) throw error;
      const d: any = data || {};
      const reply: Msg = { role: "assistant", content: d.reply || "…", intent: d.intent };
      if (d.intent === "free_explore") {
        setFreeMode(true);
      } else if (d.route && d.cta_label) {
        reply.cta = { label: d.cta_label, route: d.route };
        setFreeMode(false);
      }
      setMsgs((m) => [...m, reply]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: t("pip.error") }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center md:bottom-6"
        aria-label={t("pip.openLabel")}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] glass-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden md:bottom-24"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-background/80 backdrop-blur">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="font-semibold text-sm">{t("pip.title")}</p>
              {freeMode && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground ml-auto">{t("pip.freeMode")}</span>}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[160px]">
              {msgs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">{t("pip.welcome")}</p>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.cta && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2 w-full"
                        onClick={() => { navigate(m.cta!.route); setOpen(false); }}
                      >
                        {m.cta.label} →
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-muted rounded-2xl px-3 py-2"><Loader2 className="w-4 h-4 animate-spin" /></div></div>}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="border-t border-border p-2 flex gap-2 bg-background/80"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("pip.placeholder")}
                disabled={loading}
                autoFocus
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalPipChat;
