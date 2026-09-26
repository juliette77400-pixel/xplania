import { LifeBuoy } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const SUPPORT_EMAIL = "juliette77400@gmail.com";

/** Always-visible beta support button: opens a pre-filled email with the current page. */
const HelpButton = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const subject = t("help.subject");
  const body = t("help.body", { page: `https://xplania.app${pathname}` });
  const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <a
      href={href}
      aria-label={t("help.label")}
      className="fixed bottom-14 left-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-md hover:border-primary hover:text-primary transition-colors min-h-[44px]"
    >
      <LifeBuoy className="w-4 h-4 text-primary" aria-hidden="true" />
      {t("help.label")}
    </a>
  );
};

export default HelpButton;
