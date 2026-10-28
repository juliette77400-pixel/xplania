// Profiles data-layer helpers. Public display name is read from many places
// (chat headers, cards, exports) — centralize the tiny query here.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { pickFirstName } from "@/lib/display-name";

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

/** First name of the signed-in student, updated everywhere as soon as the profile name changes. */
export function useFirstName(): string {
  const { user } = useAuth();
  const profileName = useDisplayName(user?.id);
  return pickFirstName(profileName, user?.user_metadata as Record<string, unknown> | undefined, user?.email);
}

/**
 * Saves the display name on the signed-in student's own profile only (never the e-mail or the
 * sign-in data), then refreshes every screen reading it.
 */
export function useUpdateDisplayName() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("not_signed_in");
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, display_name: name }, { onConflict: "user_id" })
        .select("display_name")
        .single();
      if (error) throw error;
      return (data?.display_name as string | null) ?? null;
    },
    onSuccess: (saved) => {
      qc.setQueryData(profileQueryKey(user?.id), saved);
    },
  });
}
