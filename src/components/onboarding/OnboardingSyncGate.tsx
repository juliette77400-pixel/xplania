import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { travelerProfileKey } from "@/hooks/useTravelerProfile";
import {
  getLocalOnboarding,
  setLocalOnboarding,
  trackOnboardingEvent,
  clearLocalOnboarding,
} from "@/lib/onboarding-state";
import { TRAVELER_DIMENSIONS } from "@/lib/traveler-badge";

/**
 * Non-visual gate mounted once inside AuthProvider. When a user becomes
 * authenticated and we still have anonymous Tinder progress in localStorage,
 * we push it into `traveler_profiles` + `user_swipes` and jump them to the
 * next onboarding step so nothing is lost.
 */
const OnboardingSyncGate = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;

    (async () => {
      const local = getLocalOnboarding();
      const hasSwipes = local.swipes.length > 0;
      const hasResult = !!local.result;
      const hasNeeds = local.needs.length > 0;
      const hasQualif = Object.keys(local.qualif).length > 0;
      if (!hasSwipes && !hasResult && !hasNeeds && !hasQualif) return;

      // Load existing DB profile to avoid stomping on finished users.
      const { data: existing } = await supabase
        .from("traveler_profiles")
        .select("completed_at, onboarding_step")
        .eq("user_id", user.id)
        .maybeSingle();

      const alreadyDone =
        existing?.onboarding_step === "done" || !!existing?.completed_at;

      // Sync swipes (idempotent).
      if (hasSwipes && !alreadyDone) {
        const rows = local.swipes.map((s) => ({
          user_id: user.id,
          card_id: s.card_id,
          direction: s.direction,
        }));
        await supabase
          .from("user_swipes")
          .upsert(rows as never, { onConflict: "user_id,card_id" });
      }

      // Sync profile (only if not already completed).
      if (!alreadyDone) {
        const row: Record<string, unknown> = {
          user_id: user.id,
          need_tags: local.needs,
          qualif: local.qualif,
          onboarding_step: "besoin",
        };
        if (local.result) {
          row.badge = local.result.badge;
          row.recommended_features = local.result.features;
          row.reward_points = local.result.reward_points;
          row.reward_unlocks = local.result.reward_unlocks;
          row.completed_at = local.result.completed_at;
          for (const d of TRAVELER_DIMENSIONS) {
            row[`${d}_score`] = Math.max(0, local.result.scores[d] ?? 0);
          }
        }
        const { error } = await supabase
          .from("traveler_profiles")
          .upsert(row as never, { onConflict: "user_id" });
        if (error) {
          console.warn("[onboarding-sync] profile upsert failed", error.message);
          return; // keep localStorage so we can retry next mount
        }
      }

      queryClient.invalidateQueries({ queryKey: travelerProfileKey(user.id) });
      trackOnboardingEvent("sync_complete", {
        swipes: local.swipes.length,
        had_result: hasResult,
      });

      // Clear the anonymous cache but keep session_id for continuity of tracking.
      const sessionId = local.session_id;
      clearLocalOnboarding();
      setLocalOnboarding({ session_id: sessionId, step: alreadyDone ? "done" : "besoin" });

      // Only auto-navigate if the user landed on an onboarding entry route.
      const path = window.location.pathname;
      if (alreadyDone) {
        if (path === "/" || path.startsWith("/onboarding") || path.startsWith("/profil-voyageur")) {
          navigate("/app", { replace: true });
        }
        return;
      }
      if (path === "/onboarding/signup" || path === "/profil-voyageur/resultat") {
        navigate("/onboarding/besoin", { replace: true });
      }
    })().catch((err) => console.warn("[onboarding-sync] error", err));
  }, [user, loading, navigate, queryClient]);

  return null;
};

export default OnboardingSyncGate;
