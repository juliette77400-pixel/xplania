import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  type QuotaTool,
  isDevMode,
  setLocalUsage,
  getUsage,
  getLimit as getLocalLimit,
} from "@/lib/usage-quota";

type ServerQuotaRow = { used: number; limit: number; admin?: boolean; anon?: boolean };

const warnedThisSession = new Set<QuotaTool>();

const quotaKey = (userId: string | undefined, tool: QuotaTool) =>
  ["quota", userId ?? "anon", tool] as const;

/**
 * Fetches the caller's server-side quota row for `tool`. Falls back to the
 * localStorage counter when the user is anonymous or the server is
 * unreachable — clients still see a plausible number for the UI even when
 * offline. Admins get `limit: -1` (unlimited) from the RPC and bypass all
 * gating.
 */
const fetchQuota = async (
  tool: QuotaTool,
  isAuthed: boolean,
): Promise<ServerQuotaRow> => {
  if (!isAuthed) {
    return { used: getUsage(tool), limit: getLocalLimit(tool) as number, anon: true };
  }
  try {
    const { data, error } = await supabase.rpc("get_quota_status", { _tool: tool });
    if (error || !data) throw error ?? new Error("no_data");
    const row = data as ServerQuotaRow;
    if (typeof row.used === "number") setLocalUsage(tool, row.used);
    return row;
  } catch (e) {
    console.warn("[useQuota] falling back to local counter", tool, e);
    return { used: getUsage(tool), limit: getLocalLimit(tool) as number };
  }
};

export function useQuota(tool: QuotaTool) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: quotaKey(user?.id, tool),
    queryFn: () => fetchQuota(tool, !!user),
    staleTime: 30 * 1000,
  });

  const row = q.data ?? { used: getUsage(tool), limit: getLocalLimit(tool) as number };
  const dev = isDevMode();
  const isUnlimited = dev || row.admin === true || row.limit === -1;

  const usage = isUnlimited ? 0 : row.used;
  const limit = isUnlimited ? Infinity : row.limit;
  const remaining = isUnlimited ? Infinity : Math.max(0, row.limit - row.used);
  const reached = !isUnlimited && row.used >= row.limit;

  const consume = useCallback(() => {
    if (isUnlimited) return { reached: false, usage: 0 };
    // Optimistic local bump; the server-side counter is authoritative and
    // will be reconciled on next fetch. Edge functions themselves call
    // `consume_quota` before running, so localStorage tampering does not
    // grant extra runs.
    const next = row.used + 1;
    setLocalUsage(tool, next);
    qc.setQueryData(quotaKey(user?.id, tool), { ...row, used: next });
    // Nudge the server-side value on the next tick.
    qc.invalidateQueries({ queryKey: quotaKey(user?.id, tool) });

    const remainingAfter = row.limit - next;
    const ratio = next / row.limit;
    if (ratio >= 0.8 && remainingAfter >= 1 && !warnedThisSession.has(tool)) {
      warnedThisSession.add(tool);
      toast(
        remainingAfter === 1
          ? "Plus que 1 génération gratuite avant la fin ✨"
          : `Plus que ${remainingAfter} générations gratuites avant la fin ✨`,
        {
          description: "Inscris-toi à la liste premium pour un accès illimité dès l'ouverture.",
          duration: 6000,
        },
      );
    }
    return { reached: next >= row.limit, usage: next };
  }, [isUnlimited, row, tool, qc, user?.id]);

  // Keep localStorage mirror in sync when the server tells us a fresh number.
  useEffect(() => {
    if (typeof row.used === "number" && !isUnlimited) setLocalUsage(tool, row.used);
  }, [row.used, isUnlimited, tool]);

  return { usage, limit, remaining, reached, consume };
}
