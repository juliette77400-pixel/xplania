// Local-first onboarding state. Persists progress in localStorage so a visitor
// can leave and come back mid-parcours without losing their answers. Once the
// user signs up, the values are synced into `traveler_profiles`.

export const ONBOARDING_STEPS = [
  "welcome",
  "besoin",
  "qualif",
  "signup",
  "tinder",
  "resultat",
  "features",
  "essai",
  "done",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingQualif {
  budget?: "low" | "mid" | "high";
  duration?: "weekend" | "week" | "long";
  company?: "solo" | "couple" | "family" | "friends";
}

export interface LocalOnboarding {
  step: OnboardingStep;
  needs: string[];
  qualif: OnboardingQualif;
}

const KEY = "xplania:onboarding";

const empty = (): LocalOnboarding => ({ step: "welcome", needs: [], qualif: {} });

export function getLocalOnboarding(): LocalOnboarding {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    return { ...empty(), ...parsed };
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

/** Maps an onboarding step to its route so ProtectedRoute can resume. */
export function stepToRoute(step: OnboardingStep | null | undefined): string {
  switch (step) {
    case "welcome":
      return "/welcome";
    case "besoin":
      return "/onboarding/besoin";
    case "qualif":
      return "/onboarding/qualif";
    case "signup":
      return "/onboarding/signup";
    case "tinder":
      return "/profil-voyageur";
    case "resultat":
      return "/profil-voyageur/resultat";
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
    pathname === "/welcome" ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/profil-voyageur")
  );
}
