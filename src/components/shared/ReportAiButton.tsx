// Floating "report an incorrect AI answer" button shown on AI tool pages; sends the report by email.
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

const ReportAiButton = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Available on every page for signed-in users (keeps spam out of the inbox).
  if (!user) return null;

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await emailjs.send("service_23bwf9g", "template_2o6dhup", {
        rating: "Signalement IA",
        suggestions: `[Réponse IA incorrecte] Page : ${pathname}\n\n${text.trim().slice(0, 2000)}`,
        problems: "",
        user_email: user.email ?? "",
        date: new Date().toLocaleString("fr-FR"),
        to_email: "juliettenoel.xplania@gmail.com",
      }, "g30bYpbP1x83gUEsQ");
      toast.success(t("reportAi.thanks"));
      setText("");
      setOpen(false);
    } catch {
      toast.error(t("reportAi.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 rounded-full bg-background/80 backdrop-blur"
        aria-label={t("reportAi.button")}
      >
        <Flag className="w-4 h-4 sm:mr-1.5" />
        <span className="hidden sm:inline">{t("reportAi.button")}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reportAi.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("reportAi.desc")}</p>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={5} placeholder={t("reportAi.placeholder")} />
          <Button onClick={send} disabled={sending || !text.trim()}>{t("reportAi.send")}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportAiButton;
