import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

interface Props {
  onCreateTrip: () => void;
}

const FinalCtaSection = ({ onCreateTrip }: Props) => {
  const { t } = useTranslation();
  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-8 md:p-12 border border-primary/20">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
          {t("home.ctaFinal.title")}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          {t("home.ctaFinal.subtitle")}
        </p>
        <button
          onClick={onCreateTrip}
          className="gradient-button px-8 py-4 rounded-xl text-primary-foreground font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-5 h-5" />
          {t("home.ctaFinal.cta")}
        </button>
      </div>
    </section>
  );
};

export default FinalCtaSection;
