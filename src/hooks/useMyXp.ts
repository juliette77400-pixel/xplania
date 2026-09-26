import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** The signed-in user's XP and validated badges, computed server-side
 *  with the same formula as the global leaderboard (single source of truth). */
export function useMyXp() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-xp", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("leaderboard-xp");
      if (error) throw error;
      return (data?.me ?? { xp: 0, badges: 0 }) as { xp: number; badges: number };
    },
  });
  return { xp: q.data?.xp ?? 0, badges: q.data?.badges ?? 0, loading: q.isLoading };
}
