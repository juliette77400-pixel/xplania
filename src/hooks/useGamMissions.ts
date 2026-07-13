import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { GamBadge, GamCategory } from "@/hooks/useGamification";

export type MissionRow = {
  id: string;
  badge_id: string;
  scope: "weekly" | "monthly";
  start_date: string;
  end_date: string;
  active: boolean;
  user_id: string | null;
  badge?: GamBadge & { category?: GamCategory };
  done?: boolean;
};

export const gamMissionsQueryKey = (userId: string | undefined) =>
  ["gam_missions", userId] as const;

export function useGamMissions() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: gamMissionsQueryKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      // Ask the edge function to ensure the user has current missions
      try {
        await supabase.functions.invoke("gam-rotate-missions", { body: {} });
      } catch (e) {
        console.warn("rotate-missions failed", e);
      }

      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("gam_current_missions")
        .select("*, badge:gam_badges(*, category:gam_categories(*))")
        .eq("active", true)
        .or(`user_id.eq.${user!.id},user_id.is.null`)
        .gte("end_date", nowIso)
        .order("scope");

      if (error) {
        console.warn(error);
        return [] as MissionRow[];
      }
      const rows = (data || []) as any as MissionRow[];

      // Mark as done if a validated claim exists for the badge
      const badgeIds = rows.map((r) => r.badge_id);
      let done = new Set<string>();
      if (badgeIds.length) {
        const { data: claims } = await supabase
          .from("gam_badge_claims")
          .select("badge_id,status")
          .eq("user_id", user!.id)
          .in("badge_id", badgeIds);
        done = new Set(
          (claims || []).filter((c: any) => c.status === "validated").map((c: any) => c.badge_id),
        );
      }
      return rows.map((r) => ({ ...r, done: done.has(r.badge_id) }));
    },
  });

  return { missions: data ?? [], loading: user ? isLoading : false, refetch };
}
