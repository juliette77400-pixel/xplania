import { useState, useCallback } from "react";
import { type QuotaTool, getUsage, getRemaining, getLimit, hasReached, incrementUsage } from "@/lib/usage-quota";

export function useQuota(tool: QuotaTool) {
  const [usage, setUsage] = useState(() => getUsage(tool));
  const limit = getLimit(tool);
  const remaining = Math.max(0, limit - usage);
  const reached = usage >= limit;

  const consume = useCallback(() => {
    const result = incrementUsage(tool);
    setUsage(result.usage);
    return result;
  }, [tool]);

  return { usage, limit, remaining, reached, consume };
}
