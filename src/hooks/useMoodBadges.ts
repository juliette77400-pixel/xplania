import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MOOD_BADGES, type BadgeContext } from "@/lib/mood-badges";

export interface MoodBadge {
  id: string;
  user_id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  unlocked_at: string;
}

export const moodBadgesQueryKey = (userId: string | undefined) =>
  ["mood_badges", userId] as const;

export function useMoodBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, refetch } = useQuery({
    queryKey: moodBadgesQueryKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_badges")
        .select("*")
        .eq("user_id", user!.id)
        .order("unlocked_at", { ascending: false });
      return ((data as any) || []) as MoodBadge[];
    },
  });

  const badges = useMemo(() => data ?? [], [data]);

  const evaluate = useCallback(
    async (ctx: BadgeContext) => {
      if (!user) return;
      const owned = new Set(badges.map((b) => b.code));
      const toUnlock = MOOD_BADGES.filter((b) => !owned.has(b.code) && b.check(ctx));
      if (toUnlock.length === 0) return;

      const rows = toUnlock.map((b) => ({
        user_id: user.id,
        code: b.code,
        name: b.name,
        description: b.description,
        icon: b.icon,
      }));
      const { data, error } = await supabase.from("mood_badges").insert(rows).select("*");
      if (error) {
        console.error(error);
        return;
      }
      queryClient.setQueryData<MoodBadge[]>(moodBadgesQueryKey(user.id), (prev) => [
        ...(((data as any) || []) as MoodBadge[]),
        ...(prev || []),
      ]);
      toUnlock.forEach((b) =>
        toast.success(`${b.icon} Badge débloqué : ${b.name}`, { description: b.description }),
      );
    },
    [user, badges, queryClient],
  );

  return { badges, evaluate, reload: refetch };
}
