import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Gift, Download, Mail, CheckCircle2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadChecklistPdf } from "@/lib/lead-magnet-pdf";

const STORAGE_KEY = "xplania-exit-intent-shown";

const ExitIntentDialog = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;

    let armed = false;
    // Arm after 8s on the page so we don't trigger on instant navigation
    const armTimer = setTimeout(() => {
      armed = true;
    }, 8000);

    const handleMouseOut = (e: MouseEvent) => {
      if (!armed) return;
      // Trigger only when cursor leaves toward the top (typical exit-intent)
      if (e.clientY <= 0 && !e.relatedTarget) {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setOpen(true);
      }
    };

    document.addEventListener("mouseout", handleMouseOut);
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(t("exitIntent.invalidEmail"));
      return;
    }
    setSubmitting(true);
    try {
      const { data: rpcData, error } = await supabase.rpc("subscribe_to_waitlist" as never, {
        _email: email.trim().toLowerCase(),
        _source: "lead-magnet:exit-intent",
        _pack: "checklist-pdf",
        _metadata: { magnet: "pre-departure-checklist" } as never,
      } as never);
      const result = rpcData as { ok: boolean; reason?: string; cooldown_days?: number } | null;
      if (error || (result && result.ok === false && result.reason !== "cooldown")) {
        // Soft-fail: still give the PDF
        downloadChecklistPdf();
        setDone(true);
        return;
      }
      // On cooldown OR success → still deliver the PDF (the user already opted in once)
      downloadChecklistPdf();
      setDone(true);
      toast.success(t("exitIntent.success"));
    } catch (err) {
      downloadChecklistPdf();
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: "var(--gradient-primary)" }}
          />
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            aria-label="close"
          >
            <X className="w-4 h-4" />
          </button>

          {!done ? (
            <>
              <div className="relative flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl gradient-button flex items-center justify-center">
                  <Gift className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>
              <DialogHeader className="relative text-center">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {t("exitIntent.title")}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                  {t("exitIntent.subtitle")}
                </DialogDescription>
              </DialogHeader>

              <ul className="relative space-y-2 my-5 text-sm">
                {[
                  t("exitIntent.bullet1"),
                  t("exitIntent.bullet2"),
                  t("exitIntent.bullet3"),
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleSubmit} className="relative space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder={t("exitIntent.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full gradient-button py-3 rounded-lg text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {submitting ? t("exitIntent.sending") : t("exitIntent.cta")}
                </button>
                <p className="text-[11px] text-center text-muted-foreground">
                  {t("exitIntent.privacy")}
                </p>
              </form>
            </>
          ) : (
            <div className="relative text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t("exitIntent.doneTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {t("exitIntent.doneSubtitle")}
              </p>
              <button
                onClick={() => downloadChecklistPdf()}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {t("exitIntent.downloadAgain")}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentDialog;
