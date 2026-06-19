import { useEffect, useState, useCallback } from "react";
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

export function useGamification() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<GamCategory[]>([]);
  const [badges, setBadges] = useState<GamBadge[]>([]);
  const [claims, setClaims] = useState<GamClaim[]>([]);
  const [prefs, setPrefs] = useState<string[]>([]); // category ids
  const [visibility, setVisibility] = useState<GamVisibility>("anonymized");
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [catRes, badgeRes, claimsRes, prefsRes, settingsRes, ptsRes] = await Promise.all([
      supabase.from("gam_categories").select("*").eq("active", true).order("position"),
      supabase.from("gam_badges").select("*").eq("active", true),
      supabase.from("gam_badge_claims").select("*").eq("user_id", user.id),
      supabase.from("gam_user_category_prefs").select("category_id").eq("user_id", user.id),
      supabase.from("gam_user_settings").select("competition_visibility").eq("user_id", user.id).maybeSingle(),
      supabase.rpc("gam_user_points", { _user_id: user.id }),
    ]);
    setCategories(catRes.data || []);
    setBadges(badgeRes.data || []);
    setClaims(claimsRes.data || []);
    setPrefs((prefsRes.data || []).map((p: any) => p.category_id));
    setVisibility((settingsRes.data?.competition_visibility as GamVisibility) || "anonymized");
    setPoints((ptsRes.data as number) || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const setPrefsRemote = useCallback(async (categoryIds: string[]) => {
    if (!user) return;
    // Replace all
    await supabase.from("gam_user_category_prefs").delete().eq("user_id", user.id);
    if (categoryIds.length) {
      await supabase.from("gam_user_category_prefs").insert(
        categoryIds.map((category_id) => ({ user_id: user.id, category_id }))
      );
    }
    setPrefs(categoryIds);
  }, [user]);

  const setVisibilityRemote = useCallback(async (v: GamVisibility) => {
    if (!user) return;
    await supabase.from("gam_user_settings").upsert(
      { user_id: user.id, competition_visibility: v },
      { onConflict: "user_id" }
    );
    setVisibility(v);
  }, [user]);

  const submitClaim = useCallback(async (
    badgeId: string,
    payload: { proof_type: string; proof_url?: string; geo_lat?: number; geo_lng?: number; note?: string }
  ) => {
    if (!user) throw new Error("not_authenticated");
    const { data, error } = await supabase.from("gam_badge_claims").insert({
      user_id: user.id,
      badge_id: badgeId,
      status: "submitted",
      proof_type: payload.proof_type,
      proof_url: payload.proof_url,
      geo_lat: payload.geo_lat,
      geo_lng: payload.geo_lng,
      submitted_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    setClaims((c) => [...c.filter((x) => x.badge_id !== badgeId), data as GamClaim]);
    return data as GamClaim;
  }, [user]);

  // Build merged list with status, optionally filtered to user prefs
  const visibleBadges: BadgeWithClaim[] = badges
    .filter((b) => prefs.length === 0 || prefs.includes(b.category_id))
    .map((b) => {
      const cat = categories.find((c) => c.id === b.category_id);
      const claim = claims
        .filter((c) => c.badge_id === b.id)
        .sort((a, z) => (z.created_at || "").localeCompare(a.created_at || ""))[0];
      const status: BadgeWithClaim["status"] = claim?.status ?? "locked";
      return { ...b, category: cat, claim, status };
    });

  return {
    loading,
    categories,
    badges: visibleBadges,
    allBadges: badges,
    claims,
    prefs,
    visibility,
    points,
    setPrefs: setPrefsRemote,
    setVisibility: setVisibilityRemote,
    submitClaim,
    refetch,
  };
}
