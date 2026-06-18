import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";

interface Props {
  destination?: string;
  onAskPip?: () => void;
}

const ICONS = ["🔍", "📅", "📄", "🏛️", "✅", "🛂"];

const VisaProcessStepper = ({ destination, onAskPip }: Props) => {
  const { t } = useTranslation();
  const steps = t("guideVisa.stepper.steps", { returnObjects: true }) as Array<{
    title: string;
    detail: string;
  }>;
  const list = Array.isArray(steps) ? steps : [];

  return (
    <section className="glass-card rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        {t("guideVisa.stepper.title")}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {list.map((s, i) => (
          <AccordionItem key={i} value={`step-${i}`} className="border-border/40">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span aria-hidden>{ICONS[i]}</span>
                <span>{s.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pl-12">
              {s.detail}
              {destination && i === 0 && (
                <span className="block mt-1 text-xs text-foreground">→ {destination}</span>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <button
        onClick={onAskPip}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        {t("guideVisa.stepper.reassurance")}
      </button>
    </section>
  );
};

export default VisaProcessStepper;
