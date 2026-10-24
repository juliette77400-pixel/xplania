import { useTranslation } from "react-i18next";
import { ArrowRight, MessageCircle } from "lucide-react";

interface Props {
  onCreateTrip: () => void;
  onFeedback?: () => void;
}

const FinalCtaSection = ({ onCreateTrip, onFeedback }: Props) => {
  const { t } = useTranslation();
  return (
    <section id="feedback" className="px-4 py-14 sm:py-20">
      <div className="glass-card mx-auto max-w-3xl rounded-3xl border border-primary/20 p-8 text-center md:p-12">
        <h2 className="mb-3 text-balance text-2xl font-extrabold sm:text-3xl md:text-4xl">{t("landing2.final.title")}</h2>
        <p className="mx-auto mb-8 max-w-xl text-pretty text-muted-foreground">{t("landing2.final.text")}</p>
        <button
          onClick={onCreateTrip}
          className="gradient-button inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("prepLanding.cta")}<ArrowRight className="h-5 w-5" aria-hidden />
        </button>
        <p className="mt-4 text-sm text-muted-foreground">{t("prepLanding.reassurance")}</p>
        {onFeedback && (
          <button onClick={onFeedback} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            <MessageCircle className="h-4 w-4" aria-hidden />{t("landing2.final.feedback")}
          </button>
        )}
      </div>
    </section>
  );
};

export default FinalCtaSection;
