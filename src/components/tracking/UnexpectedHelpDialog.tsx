import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LifeBuoy, Loader2, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const KINDS = ["documents", "transport", "health", "money", "housing", "safety", "other"] as const;
type Kind = (typeof KINDS)[number];
const EMOJI: Record<Kind, string> = { documents: "🛂", transport: "🚆", health: "🩺", money: "💳", housing: "🏠", safety: "🚨", other: "❓" };

interface Help {
  needs_more_info: boolean;
  questions?: string[];
  urgency: "low" | "medium" | "high" | "emergency";
  summary: string;
  steps: { title: string; detail: string }[];
  contacts?: { label: string; value: string }[];
  reassurance?: string;
}

export default function UnexpectedHelpDialog({ destination, lat, lng }: { destination?: string; lat?: number; lng?: number }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind | null>(null);
  const [details, setDetails] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [help, setHelp] = useState<Help | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => { setKind(null); setDetails(""); setAnswers([]); setHelp(null); };

  const ask = async (withAnswers = false) => {
    if (!kind) return;
    setLoading(true);
    const qa = withAnswers && help?.questions ? help.questions.map((q, i) => ({ q, a: answers[i] || "" })) : [];
    const { data, error } = await supabase.functions.invoke("trip-unexpected", {
      body: { kind, details, answers: qa, destination, lat, lng, locale: i18n.language?.startsWith("en") ? "en" : "fr" },
    });
    setLoading(false);
    if (error || !data || data.error) { toast.error(t("unexpected.error")); return; }
    setAnswers([]);
    setHelp(data as Help);
  };

  const urgencyClass = help?.urgency === "emergency" || help?.urgency === "high"
    ? "border-destructive/50 bg-destructive/10" : "border-primary/30 bg-primary/5";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto border-primary/40">
          <LifeBuoy className="w-4 h-4 mr-2" /> {t("unexpected.cta")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("unexpected.title")}</DialogTitle></DialogHeader>

        {!help && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("unexpected.intro")}</p>
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)}
                  className={`rounded-xl border p-3 text-left text-sm transition ${kind === k ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}>
                  {EMOJI[k]} {t(`unexpected.kinds.${k}`)}
                </button>
              ))}
            </div>
            <Textarea value={details} maxLength={600} onChange={(e) => setDetails(e.target.value)} placeholder={t("unexpected.detailsPh")} />
            <Button className="w-full" disabled={!kind || loading} onClick={() => ask(false)}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {t("unexpected.submit")}
            </Button>
          </div>
        )}

        {help?.needs_more_info && help.questions?.length ? (
          <div className="space-y-3">
            <p className="text-sm">{help.summary}</p>
            {help.questions.map((q, i) => (
              <div key={i} className="space-y-1">
                <label className="text-sm font-medium">{q}</label>
                <Input value={answers[i] || ""} maxLength={300} onChange={(e) => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }} />
              </div>
            ))}
            <Button className="w-full" disabled={loading} onClick={() => ask(true)}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {t("unexpected.continue")}
            </Button>
          </div>
        ) : help && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-3 text-sm ${urgencyClass}`}>
              <div className="font-semibold">{t(`unexpected.urgency.${help.urgency}`)}</div>
              <div>{help.summary}</div>
            </div>
            <ol className="space-y-3">
              {help.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                  <div><div className="font-medium">{s.title}</div><div className="text-sm text-muted-foreground">{s.detail}</div></div>
                </li>
              ))}
            </ol>
            {!!help.contacts?.length && (
              <div className="space-y-1 rounded-xl border border-border p-3">
                {help.contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-primary" /> <span className="text-muted-foreground">{c.label} :</span> <span className="font-medium">{c.value}</span></div>
                ))}
              </div>
            )}
            {help.reassurance && <p className="text-sm italic text-muted-foreground">{help.reassurance}</p>}
            <p className="text-xs text-muted-foreground">{t("unexpected.disclaimer")}</p>
            <Button variant="ghost" className="w-full" onClick={reset}>{t("unexpected.again")}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
