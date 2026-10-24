import { Flag, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { isPipHidden, openPipChat, openReportAi } from "@/lib/help-events";

export const SUPPORT_EMAIL = "juliette77400@gmail.com";

/** The only floating button: assistant, report an AI answer, or email the team. */
const HelpButton = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const subject = t("help.subject");
  const body = t("help.body", { page: `https://xplania.app${pathname}` });
  const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const showPip = !isPipHidden(pathname);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("help.menuLabel")}
          className="fixed bottom-4 right-4 z-40 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          {t("help.menuButton")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-64">
        {showPip && (
          <DropdownMenuItem onSelect={openPipChat} className="cursor-pointer gap-2">
            <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />{t("help.askAssistant")}
          </DropdownMenuItem>
        )}
        {user && (
          <DropdownMenuItem onSelect={openReportAi} className="cursor-pointer gap-2">
            <Flag className="h-4 w-4 text-primary" aria-hidden="true" />{t("reportAi.button")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="cursor-pointer gap-2">
          <a href={href}><Mail className="h-4 w-4 text-primary" aria-hidden="true" />{t("help.writeTeam")}</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HelpButton;
