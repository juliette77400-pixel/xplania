// Local-first onboarding state. Persists progress in localStorage so an
// anonymous visitor can go through the entire Tinder + result screens without
// an account, then sync everything into `traveler_profiles` at signup.

import type { TravelerScores, TravelerBadgeKey, FeatureKey } from "@/lib/traveler-badge";
import { supabase } from "@/integrations/supabase/client";

export const ONBOARDING_STEPS = [
  "tinder", // anonymous swipe deck at "/"
  "resultat", // anonymous or authed result screen
  "signup", // create account
  "besoin", // quick need selection (post-signup)
  "features", // feature picker
  "essai", // preview
  "done",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingQualif {
  budget?: "low" | "mid" | "high";
  duration?: "weekend" | "week" | "long";
  company?: "solo" | "couple" | "family" | "friends";
}

export interface StoredSwipe {
  card_id: string;
  direction: "right" | "left" | "skip";
}

export interface StoredResult {
  badge: TravelerBadgeKey;
  scores: TravelerScores;
  features: FeatureKey[];
  reward_points: number;
  reward_unlocks: string[];
  completed_at: string;
}

export interface LocalOnboarding {
  step: OnboardingStep;
  needs: string[];
  qualif: OnboardingQualif;
  swipes: StoredSwipe[];
  result: StoredResult | null;
  session_id: string;
  started_at: string;
}

const KEY = "xplania:onboarding";

function newSessionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  }
}

const empty = (): LocalOnboarding => ({
  step: "tinder",
  needs: [],
  qualif: {},
  swipes: [],
  result: null,
  session_id: newSessionId(),
  started_at: new Date().toISOString(),
});

export function getLocalOnboarding(): LocalOnboarding {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seed = empty();
      window.localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    const base = empty();
    return {
      ...base,
      ...parsed,
      // Preserve identity fields once created.
      session_id: parsed.session_id || base.session_id,
      started_at: parsed.started_at || base.started_at,
      swipes: Array.isArray(parsed.swipes) ? parsed.swipes : [],
      needs: Array.isArray(parsed.needs) ? parsed.needs : [],
      qualif: parsed.qualif ?? {},
      result: parsed.result ?? null,
    };
  } catch {
    return empty();
  }
}

export function setLocalOnboarding(patch: Partial<LocalOnboarding>): LocalOnboarding {
  const merged = { ...getLocalOnboarding(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
  return merged;
}

export function clearLocalOnboarding() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Add or replace a single swipe (dedup by card_id). */
export function pushLocalSwipe(swipe: StoredSwipe): LocalOnboarding {
  const current = getLocalOnboarding();
  const others = current.swipes.filter((s) => s.card_id !== swipe.card_id);
  return setLocalOnboarding({ swipes: [...others, swipe] });
}

/** Maps an onboarding step to its route so ProtectedRoute can resume. */
export function stepToRoute(step: OnboardingStep | null | undefined): string {
  switch (step) {
    case "tinder":
      return "/";
    case "resultat":
      return "/profil-voyageur/resultat";
    case "signup":
      return "/onboarding/signup";
    case "besoin":
      return "/onboarding/besoin";
    case "features":
      return "/profil-voyageur/features";
    case "essai":
      return "/profil-voyageur/essai";
    case "done":
    default:
      return "/app";
  }
}

export function isOnboardingRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/profil-voyageur")
  );
}

/**
 * Fire-and-forget event tracking. Writes to `onboarding_events`. Safe to call
 * before or after signup — user_id is bound only if a session exists.
 */
export function trackOnboardingEvent(
  event: string,
  meta: Record<string, unknown> = {},
): void {
  try {
    const local = getLocalOnboarding();
    const payload = {
      session_id: local.session_id,
      event,
      step: local.step,
      meta: meta as never,
    };
    void supabase
      .from("onboarding_events")
      .insert(payload as never)
      .then(({ error }) => {
        if (error) console.warn("[onboarding-track]", event, error.message);
      });
  } catch (e) {
    console.warn("[onboarding-track] failed", e);
  }
}
