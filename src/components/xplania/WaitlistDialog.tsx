import { useState, useEffect } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Check, Rocket, Mail, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Baseline so the counter never feels empty (social proof). Real signups add to it.
const WAITLIST_BASELINE = 327;

const emailSchema = z.string().trim().email("Email invalide").max(255);

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Where the dialog was triggered from (quota, offers, pack id, feature id…) */
  source: string;
  /** Optional pack name when triggered from a specific pack card */
  pack?: string;
  /** Optional title override */
  title?: string;
  /** Optional teaser sentence override */
  teaser?: string;
}

const WaitlistDialog = ({ open, onOpenChange, source, pack, title, teaser }: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  // Fetch live waitlist count when the dialog opens
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
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("premium_waitlist").insert({
      email: parsed.data.toLowerCase(),
      source,
      pack: pack ?? null,
      user_id: userData.user?.id ?? null,
    });
    setLoading(false);

    // Treat duplicate as success — user is already on the list
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Oups, une erreur est survenue. Réessaye.");
      return;
    }
    setSuccess(true);
    toast.success("Tu es sur la liste 🚀");
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      // reset after fade out
      setTimeout(() => { setSuccess(false); setEmail(""); }, 200);
    }
    onOpenChange(o);
  };

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
                  {title ?? "La version premium arrive bientôt 🚀"}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {teaser ?? "Laisse ton email pour être informé en avant-première et obtenir -30% à l'ouverture."}
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
                    <strong className="text-primary">{count.toLocaleString("fr-FR")}</strong> personnes attendent déjà
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                </motion.div>
              )}

              <ul className="space-y-2 py-4">
                {[
                  "Accès anticipé avant tout le monde",
                  "Tarif lifetime réservé aux early adopters",
                  "Aucun spam — 1 mail au lancement",
                ].map((f) => (
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
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    maxLength={255}
                    disabled={loading}
                  />
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
                      Je veux l'accès anticipé
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">
                  Pas de carte bancaire — désinscription en 1 clic.
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
              <h3 className="text-xl font-bold text-foreground mb-2">Tu es sur la liste !</h3>
              <p className="text-sm text-muted-foreground mb-6">
                On t'écrit dès que la version premium ouvre. Promis, pas de spam 💌
              </p>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="w-full"
              >
                Continuer à explorer Xplania
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistDialog;
