import { useState, useCallback } from "react";
import { toast } from "sonner";
import { type QuotaTool, getUsage, getLimit, incrementUsage, isDevMode } from "@/lib/usage-quota";

// Track which tools have already shown the soft warning this session
const warnedThisSession = new Set<QuotaTool>();

export function useQuota(tool: QuotaTool) {
  const [usage, setUsage] = useState(() => getUsage(tool));
  const limit = getLimit(tool);
  const remaining = Math.max(0, limit - usage);
  const reached = usage >= limit;

  const consume = useCallback(() => {
    const result = incrementUsage(tool);
    setUsage(result.usage);

    if (!isDevMode() && !result.reached) {
      const lim = getLimit(tool);
      const remainingAfter = lim - result.usage;
      const ratio = result.usage / lim;
      // Soft warning when user crosses 80% of their quota (and at least 1 left)
      if (ratio >= 0.8 && remainingAfter >= 1 && !warnedThisSession.has(tool)) {
        warnedThisSession.add(tool);
        toast(
          remainingAfter === 1
            ? "Plus que 1 génération gratuite avant la fin ✨"
            : `Plus que ${remainingAfter} générations gratuites avant la fin ✨`,
          {
            description: "Inscris-toi à la liste premium pour un accès illimité dès l'ouverture.",
            duration: 6000,
          }
        );
      }
    }
    return result;
  }, [tool]);

  return { usage, limit, remaining, reached, consume };
}
