import { Sparkles, Lock } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { type QuotaTool, getRemaining, getLimit, isDevMode } from "@/lib/usage-quota";

interface Props {
  tool: QuotaTool;
  toolLabel: string;
}

const QuotaBanner = ({ tool, toolLabel }: Props) => {
  const { t } = useTranslation();

  // ✨ MODIFIED (Tâche — retrait mentions UI dev mode) :
  // En mode dev/test on n'affiche AUCUN bandeau. La logique interne de bypass
  // reste active (quotas illimités), mais elle est invisible côté utilisateur.
  if (isDevMode()) return null;

  const remaining = getRemaining(tool);
  const limit = getLimit(tool);

  if (remaining <= 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 mb-4">
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <Lock className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-foreground">
            <Trans i18nKey="quotaBanner.exhausted" values={{ limit, tool: toolLabel }} components={{ 1: <strong /> }} />{" "}
            <a href="/offres" className="text-primary hover:underline font-semibold">{t("quotaBanner.upgrade")}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 mb-4">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          {t(remaining > 1 ? "quotaBanner.remainingOther" : "quotaBanner.remainingOne", { remaining, limit, tool: toolLabel })}
        </p>
      </div>
    </div>
  );
};

export default QuotaBanner;
