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
      className="border border-amber-400/40 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-100 px-3 py-2 rounded-xl flex flex-wrap items-center gap-x-3 gap-y-1.5"
    >
      <div className="flex min-w-[14rem] flex-1 items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs leading-snug">
          <strong>{t("guideVisa.disclaimer.title")} </strong>{t("guideVisa.disclaimer.body")}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-amber-900 dark:text-amber-100 text-xs font-semibold underline-offset-2 hover:underline"
      >
        {t("guideVisa.disclaimer.cta")}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

export default VisaDisclaimer;
