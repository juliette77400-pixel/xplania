import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircleHeart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const FEATURES = ["itinerary", "budget", "visa", "valise", "discover", "suivi", "carnet", "badges"];
const CONTEXTS = ["erasmus", "stage", "vacances", "autre"];
const DISMISS_KEY = "xplania-survey-dismissed-at";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
    active ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background/60 text-muted-foreground hover:border-primary/40"
  }`;

const SatisfactionSurveyCard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [nps, setNps] = useState<number | null>(null);
  const [ease, setEase] = useState<number | null>(null);
  const [feature, setFeature] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissed && Date.now() - dismissed < SNOOZE_MS) return;
    supabase.from("satisfaction_surveys").select("id").eq("user_id", user.id).limit(1).then(({ data }) => {
      if (!data?.length) setVisible(true);
    });
  }, [user]);

  if (!visible || !user) return null;

  const later = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const submit = async () => {
    if (nps === null || ease === null) return toast.error(t("survey.required"));
    setSending(true);
    const { error } = await supabase.from("satisfaction_surveys").insert({
      user_id: user.id, nps, ease, favorite_feature: feature, trip_context: context, comment: comment.trim() || null,
    });
    setSending(false);
    if (error) return toast.error(t("survey.error"));
    toast.success(t("survey.thanks"));
    setOpen(false);
    setVisible(false);
  };

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <MessageCircleHeart className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div><h2 className="font-bold">{t("survey.cardTitle")}</h2><p className="text-sm text-muted-foreground">{t("survey.cardDesc")}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={later}>{t("survey.later")}</Button>
          <Button className="gradient-button text-primary-foreground" onClick={() => setOpen(true)}>{t("survey.start")}</Button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card max-h-[90vh] overflow-y-auto border-border">
          <DialogHeader><DialogTitle>{t("survey.title")}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold">{t("survey.npsLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 11 }, (_, i) => (
                  <button key={i} type="button" onClick={() => setNps(i)} className={`${chip(nps === i)} w-9`} aria-pressed={nps === i}>{i}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t("survey.easeLabel")}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t("survey.easeLow")}</span>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" onClick={() => setEase(v)} className={`${chip(ease === v)} w-9`} aria-pressed={ease === v}>{v}</button>
                ))}
                <span>{t("survey.easeHigh")}</span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t("survey.featureLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((f) => <button key={f} type="button" onClick={() => setFeature(f)} className={chip(feature === f)} aria-pressed={feature === f}>{t(`survey.features.${f}`)}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t("survey.contextLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {CONTEXTS.map((c) => <button key={c} type="button" onClick={() => setContext(c)} className={chip(context === c)} aria-pressed={context === c}>{t(`survey.contexts.${c}`)}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t("survey.commentLabel")}</p>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder={t("survey.commentPlaceholder")} className="min-h-[90px] bg-muted" />
            </div>
            <Button onClick={submit} disabled={sending} className="gradient-button w-full text-primary-foreground">
              {sending ? t("survey.sending") : t("survey.submit")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SatisfactionSurveyCard;
