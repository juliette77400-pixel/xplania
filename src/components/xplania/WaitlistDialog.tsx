import { useState, useEffect } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, Trans } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Check, Rocket, Mail, Loader2, Users, Linkedin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WAITLIST_BASELINE = 327;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  source: string;
  pack?: string;
  title?: string;
  teaser?: string;
}

const WaitlistDialog = ({ open, onOpenChange, source, pack, title, teaser }: Props) => {
  const { t, i18n } = useTranslation();
  const emailSchema = z.string().trim().email(t("waitlist.invalidEmail")).max(255);
  const linkedinSchema = z
    .string()
    .trim()
    .max(255)
    .regex(/^https?:\/\/(www\.)?linkedin\.com\/.+/i, t("waitlist.invalidLinkedin"))
    .optional()
    .or(z.literal(""));
  const firstNameSchema = z.string().trim().max(60).optional().or(z.literal(""));

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_waitlist_count" as never);
      if (cancelled || error) return;
      const real = typeof data === "number" ? data : 0;
      setCount(WAITLIST_BASELINE + real);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const liParsed = linkedinSchema.safeParse(linkedin);
    if (!liParsed.success) {
      toast.error(liParsed.error.issues[0].message);
      return;
    }
    const fnParsed = firstNameSchema.safeParse(firstName);
    if (!fnParsed.success) {
      toast.error(fnParsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const cleanFirstName = (fnParsed.data || "").trim();
    const cleanLinkedin = (liParsed.data || "").trim();
    const linkedinMessage = cleanLinkedin
      ? t("waitlist.linkedinMessage", {
          name: cleanFirstName || t("waitlist.linkedinFallbackName"),
        })
      : null;

    const { error } = await supabase.from("premium_waitlist").insert({
      email: parsed.data.toLowerCase(),
      source,
      pack: pack ?? null,
      user_id: userData.user?.id ?? null,
      metadata: {
        first_name: cleanFirstName || null,
        linkedin_url: cleanLinkedin || null,
        linkedin_message: linkedinMessage,
        notify_via: cleanLinkedin ? ["email", "linkedin"] : ["email"],
        locale: i18n.language,
      },
    });
    setLoading(false);

    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(t("waitlist.errorGeneric"));
      return;
    }
    if (cleanLinkedin) {
      // Log the LinkedIn DM intent so it can be picked up by the team / a future webhook.
      console.info("[waitlist] LinkedIn DM requested:", { linkedin: cleanLinkedin, message: linkedinMessage });
    }
    // Fire-and-forget team notification (don't block UX if it fails).
    supabase.functions
      .invoke("notify-waitlist", {
        body: {
          email: parsed.data.toLowerCase(),
          first_name: cleanFirstName || null,
          linkedin_url: cleanLinkedin || null,
          pack: pack ?? null,
          source,
          locale: i18n.language,
        },
      })
      .catch((e) => console.warn("[waitlist] notify failed", e));
    setSuccess(true);
    toast.success(t("waitlist.successToast"));
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setTimeout(() => { setSuccess(false); setEmail(""); setFirstName(""); setLinkedin(""); }, 200);
    }
    onOpenChange(o);
  };

  const localeFmt = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <DialogHeader>
                <div className="mx-auto w-14 h-14 rounded-2xl gradient-button flex items-center justify-center mb-3">
                  <Rocket className="w-7 h-7 text-primary-foreground" />
                </div>
                <DialogTitle className="text-center text-2xl">
                  {title ?? t("waitlist.defaultTitle")}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {teaser ?? t("waitlist.defaultTeaser")}
                </DialogDescription>
              </DialogHeader>

              {count !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 mx-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 w-fit"
                >
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-foreground">
                    <Trans
                      i18nKey="waitlist.counter"
                      values={{ count: count.toLocaleString(localeFmt) }}
                      components={{ strong: <strong className="text-primary" /> }}
                    />
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                </motion.div>
              )}

              <ul className="space-y-2 py-4">
                {[t("waitlist.feature1"), t("waitlist.feature2"), t("waitlist.feature3")].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("waitlist.firstNamePlaceholder")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-9"
                    maxLength={60}
                    disabled={loading}
                    autoComplete="given-name"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t("waitlist.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    maxLength={255}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-muted-foreground pl-1">
                    {t("waitlist.linkedinLabel")}
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder={t("waitlist.linkedinPlaceholder")}
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="pl-9"
                      maxLength={255}
                      disabled={loading}
                      autoComplete="url"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-button text-primary-foreground border-0"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      {t("waitlist.submitCta")}
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">
                  {t("waitlist.noCard")}
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-primary" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t("waitlist.successTitle")}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t("waitlist.successDesc")}
              </p>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="w-full"
              >
                {t("waitlist.continueExplore")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistDialog;
