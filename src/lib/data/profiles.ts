// Profiles data-layer helpers. Public display name is read from many places
// (chat headers, cards, exports) — centralize the tiny query here.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQueryKey = (userId: string | undefined) =>
  ["profiles", userId] as const;

export async function fetchDisplayName(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.display_name as string | undefined) ?? null;
}

/**
 * React Query wrapper around `fetchDisplayName`. Returns `null` while loading
 * or when no profile row exists so callers can render placeholders.
 */
export function useDisplayName(userId: string | undefined) {
  const { data = null } = useQuery({
    queryKey: profileQueryKey(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    queryFn: () => fetchDisplayName(userId!),
  });
  return data;
}
