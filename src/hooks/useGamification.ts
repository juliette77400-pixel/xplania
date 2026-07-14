import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

export type GamCategory = Database["public"]["Tables"]["gam_categories"]["Row"];
export type GamBadge = Database["public"]["Tables"]["gam_badges"]["Row"];
export type GamClaim = Database["public"]["Tables"]["gam_badge_claims"]["Row"];
export type GamVerificationMethod = Database["public"]["Enums"]["gam_verification_method"];
export type GamClaimStatus = Database["public"]["Enums"]["gam_claim_status"];
export type GamVisibility = Database["public"]["Enums"]["gam_competition_visibility"];

export type BadgeWithClaim = GamBadge & {
  category?: GamCategory;
  claim?: GamClaim;
  status: GamClaimStatus | "locked";
};

interface GamData {
  categories: GamCategory[];
  badges: GamBadge[];
  claims: GamClaim[];
  prefs: string[];
  visibility: GamVisibility;
  points: number;
}

const EMPTY: GamData = {
  categories: [],
  badges: [],
  claims: [],
  prefs: [],
  visibility: "anonymized",
  points: 0,
};

export const gamificationQueryKey = (userId: string | undefined) =>
  ["gamification", userId] as const;

export function useGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = gamificationQueryKey(user?.id);

  const { data, isLoading, refetch } = useQuery<GamData>({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      const [catRes, badgeRes, claimsRes, prefsRes, settingsRes, ptsRes] = await Promise.all([
        supabase.from("gam_categories").select("*").eq("active", true).order("position"),
        supabase.from("gam_badges").select("*").eq("active", true),
        supabase.from("gam_badge_claims").select("*").eq("user_id", user!.id),
        supabase.from("gam_user_category_prefs").select("category_id").eq("user_id", user!.id),
        supabase.from("gam_user_settings").select("competition_visibility").eq("user_id", user!.id).maybeSingle(),
        supabase.rpc("gam_user_points", { _user_id: user!.id }),
      ]);
      return {
        categories: catRes.data || [],
        badges: badgeRes.data || [],
        claims: claimsRes.data || [],
        prefs: (prefsRes.data || []).map((p: any) => p.category_id),
        visibility: (settingsRes.data?.competition_visibility as GamVisibility) || "anonymized",
        points: (ptsRes.data as number) || 0,
      };
    },
  });

  const gam = data ?? EMPTY;

  const setData = useCallback(
    (updater: (prev: GamData) => GamData) =>
      queryClient.setQueryData<GamData>(queryKey, (prev) => updater(prev ?? EMPTY)),
    [queryClient, queryKey],
  );

  const setPrefsRemote = useCallback(
    async (categoryIds: string[]) => {
      if (!user) return;
      // Replace all
      await supabase.from("gam_user_category_prefs").delete().eq("user_id", user.id);
      if (categoryIds.length) {
        await supabase.from("gam_user_category_prefs").insert(
          categoryIds.map((category_id) => ({ user_id: user.id, category_id })),
        );
      }
      setData((prev) => ({ ...prev, prefs: categoryIds }));
    },
    [user, setData],
  );

  const setVisibilityRemote = useCallback(
    async (v: GamVisibility) => {
      if (!user) return;
      await supabase.from("gam_user_settings").upsert(
        { user_id: user.id, competition_visibility: v },
        { onConflict: "user_id" },
      );
      setData((prev) => ({ ...prev, visibility: v }));
    },
    [user],
  );

  const submitClaim = useCallback(
    async (
      badgeId: string,
      payload: { proof_type: string; proof_url?: string; geo_lat?: number; geo_lng?: number; note?: string },
    ) => {
      if (!user) throw new Error("not_authenticated");
      const { data, error } = await supabase
        .from("gam_badge_claims")
        .insert({
          user_id: user.id,
          badge_id: badgeId,
          status: "submitted",
          proof_type: payload.proof_type,
          proof_url: payload.proof_url,
          geo_lat: payload.geo_lat,
          geo_lng: payload.geo_lng,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      setData((prev) => ({
        ...prev,
        claims: [...prev.claims.filter((x) => x.badge_id !== badgeId), data as GamClaim],
      }));
      return data as GamClaim;
    },
    [user],
  );

  // Build merged list with status, optionally filtered to user prefs
  const visibleBadges: BadgeWithClaim[] = gam.badges
    .filter((b) => gam.prefs.length === 0 || gam.prefs.includes(b.category_id))
    .map((b) => {
      const cat = gam.categories.find((c) => c.id === b.category_id);
      const claim = gam.claims
        .filter((c) => c.badge_id === b.id)
        .sort((a, z) => (z.created_at || "").localeCompare(a.created_at || ""))[0];
      const status: BadgeWithClaim["status"] = claim?.status ?? "locked";
      return { ...b, category: cat, claim, status };
    });

  return {
    loading: user ? isLoading : false,
    categories: gam.categories,
    badges: visibleBadges,
    allBadges: gam.badges,
    claims: gam.claims,
    prefs: gam.prefs,
    visibility: gam.visibility,
    points: gam.points,
    setPrefs: setPrefsRemote,
    setVisibility: setVisibilityRemote,
    submitClaim,
    refetch,
  };
}
