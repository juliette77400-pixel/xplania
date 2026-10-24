import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DEFAULT_KEYS = ["q1", "q2", "q3", "q7", "q8", "q4", "q5", "q6"];

const FaqSection = ({ keys = DEFAULT_KEYS }: { keys?: string[] }) => {
  const { t } = useTranslation();

  const faqs = keys.map((k) => ({
    k,
    q: t(`faq.${k}.q`),
    a: t(`faq.${k}.a`),
  }));

  return (
    <section id="faq" className="py-14 sm:py-20">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            {t("faq.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("faq.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("faq.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-2 sm:p-6"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
                <AccordionTrigger className="text-left text-foreground hover:no-underline px-2 sm:px-4">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground px-2 sm:px-4 leading-relaxed">
                  {f.a}
                  {(f.k === "q1" || f.k === "q6" || f.k === "q7") && (
                    <a href="/offres" className="mt-2 block font-semibold text-primary hover:underline">
                      {t("faq.seeOffers")} →
                    </a>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;
