import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BrainCircuit, Check, Compass, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "xplania-onboarding-seen-v2";
const ICONS = [Compass, BrainCircuit, Sparkles];

interface Props { onCreateTrip: () => void; }

const OnboardingDialog = ({ onCreateTrip }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const slides = [1, 2, 3].map((n, i) => ({ icon: ICONS[i], title: t(`onboarding.step${n}Title`), description: t(`onboarding.step${n}Desc`) }));

  useEffect(() => {
    if (user || typeof window === "undefined" || localStorage.getItem(STORAGE_KEY)) return;
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, [user]);

  const close = () => { localStorage.setItem(STORAGE_KEY, "1"); setOpen(false); setStep(0); };
  const start = () => { close(); window.setTimeout(onCreateTrip, 180); };
  const isLast = step === slides.length - 1;
  const slide = slides[step];
  const Icon = slide.icon;

  return <Dialog open={open} onOpenChange={(value) => value ? setOpen(true) : close()}>
    <DialogContent className="max-w-2xl overflow-hidden border-border bg-background p-0 sm:rounded-3xl" aria-describedby="onboarding-description">
      <DialogTitle className="sr-only">{t("onboarding.dialogTitle")}</DialogTitle>
      <div className="grid min-h-[430px] sm:grid-cols-[.8fr_1.2fr]">
        <aside className="relative hidden overflow-hidden border-r border-border bg-card/50 p-7 sm:flex sm:flex-col">
          <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative flex items-center gap-2 font-bold"><span className="gradient-button flex h-9 w-9 items-center justify-center rounded-xl"><Sparkles className="h-4 w-4 text-primary-foreground" /></span>Xplania</div>
          <div className="relative mt-auto space-y-4">{slides.map((item, index) => <button key={item.title} onClick={() => setStep(index)} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm transition ${index === step ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`} aria-current={index === step ? "step" : undefined}><span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${index < step ? "border-primary bg-primary text-primary-foreground" : index === step ? "border-primary text-primary" : "border-border"}`}>{index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>{item.title}</button>)}</div>
        </aside>
        <main className="flex flex-col p-6 sm:p-9">
          <button onClick={close} className="ml-auto rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t("common.skip")}</button>
          <AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:.22}} className="my-auto py-8 text-center sm:text-left">
            <div className="gradient-button mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_12px_35px_hsl(var(--primary)/.18)] sm:mx-0"><Icon className="h-7 w-7 text-primary-foreground" /></div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-primary">{t("onboarding.stepLabel", { n: step + 1 })}</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{slide.title}</h2>
            <p id="onboarding-description" className="mt-3 text-sm leading-6 text-muted-foreground">{slide.description}</p>
          </motion.div></AnimatePresence>
          <div className="flex items-center justify-between border-t border-border/60 pt-5">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:invisible"><ArrowLeft className="h-4 w-4" />{t("common.previous")}</button>
            <button onClick={isLast ? start : () => setStep((s) => s + 1)} className="gradient-button inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5">{isLast ? t("onboarding.startCta") : t("common.continue")}<ArrowRight className="h-4 w-4" /></button>
          </div>
        </main>
      </div>
    </DialogContent>
  </Dialog>;
};
export default OnboardingDialog;
