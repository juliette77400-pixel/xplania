// Small pieces shared by every page assistant (Budget, Visa, Valise, Culture, Logement):
// clickable question ideas and a clear line about the tries a question uses.
import { useTranslation } from "react-i18next";
import { useQuota } from "@/hooks/useQuota";
import type { QuotaTool } from "@/lib/usage-quota";

export function AssistantSuggestions({ items, onPick, disabled }: { items: string[]; onPick: (q: string) => void; disabled?: boolean }) {
  const { t } = useTranslation();
  if (!items.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("assistant.ideas")}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((q) => (
          <button key={q} type="button" disabled={disabled} onClick={() => onPick(q)}
            className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-primary/15 disabled:opacity-50">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "Chaque question utilise 1 essai Budget · 7 restants ce mois-ci" (or unlimited). */
export function AssistantQuotaNote({ tool }: { tool: QuotaTool }) {
  const { t } = useTranslation();
  const { remaining, limit } = useQuota(tool);
  const toolName = t(`assistant.toolNames.${tool}`);
  return (
    <p className="px-1 text-[11px] text-muted-foreground">
      {limit === Infinity
        ? t("assistant.quotaUnlimited", { tool: toolName })
        : t("assistant.quotaNote", { tool: toolName, count: remaining })}
    </p>
  );
}
