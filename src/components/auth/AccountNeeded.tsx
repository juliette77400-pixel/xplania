// Shown to visitors who open a tool that keeps data on their account (Valise,
// Logement): explains why, offers the questionnaire, and points to the tools
// that work without an account.
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Lock } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { isPathEnabled } from "@/config/featureFlags";
import { OPEN_TOOL_PATHS } from "@/config/open-tools";

export type AccountTool = "valise" | "housing";
const TOOL_LABEL: Record<string, string> = { "/guide-budget": "appNav.budget", "/guide-visa": "appNav.visaShort", "/guide-culture": "appNav.cultureShort" };

const AccountNeeded = ({ tool }: { tool: AccountTool }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const open = OPEN_TOOL_PATHS.filter((p) => isPathEnabled(p));
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-xl px-4 py-16">
        <div className="rounded-[1.75rem] border border-border/70 bg-card/60 p-6 sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15"><Lock className="h-5 w-5 text-primary" aria-hidden /></span>
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">{t(`accountNeeded.${tool}.title`)}</h1>
          <p className="mt-3 text-muted-foreground">{t(`accountNeeded.${tool}.why`)}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="gradient-button h-11"><Link to="/preparation">{t("accountNeeded.start")}<ArrowRight className="ml-2 h-4 w-4" aria-hidden /></Link></Button>
            <Button asChild variant="outline" className="h-11"><Link to="/auth" state={{ from: location }}>{t("accountNeeded.signin")}</Link></Button>
          </div>
          {open.length > 0 && (
            <div className="mt-8 border-t border-border/60 pt-5">
              <p className="text-sm font-semibold">{t("accountNeeded.tryFree")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {open.map((p) => (
                  <li key={p}><Link to={p} className="inline-block rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">{t(TOOL_LABEL[p])}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AccountNeeded;
