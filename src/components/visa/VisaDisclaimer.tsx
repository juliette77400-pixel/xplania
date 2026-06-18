import { useTranslation } from "react-i18next";
import { AlertTriangle, ExternalLink } from "lucide-react";

const VisaDisclaimer = () => {
  const { t, i18n } = useTranslation();
  const url = i18n.language.startsWith("en")
    ? "https://www.diplomatie.gouv.fr/en/coming-to-france/"
    : "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/";

  return (
    <div
      role="note"
      aria-label={t("guideVisa.disclaimer.title")}
      className="sticky top-0 z-30 sm:static border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-100 px-4 py-3 rounded-r-xl flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm"
    >
      <div className="flex items-start gap-2 flex-1">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
        <div className="text-xs sm:text-sm leading-snug">
          <strong className="block sm:inline">{t("guideVisa.disclaimer.title")} </strong>
          <span>{t("guideVisa.disclaimer.body")}</span>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400 text-amber-900 dark:text-amber-100 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
      >
        🏛️ {t("guideVisa.disclaimer.cta")}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

export default VisaDisclaimer;
