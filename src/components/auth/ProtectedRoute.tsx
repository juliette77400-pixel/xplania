import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import { Loader2 } from "lucide-react";
import { stepToRoute, type OnboardingStep } from "@/lib/onboarding-state";
import AccountNeeded, { type AccountTool } from "@/components/auth/AccountNeeded";

interface Props {
  children: React.ReactNode;
  /** Skip the traveler-profile onboarding gate (used by the onboarding routes themselves). */
  skipOnboarding?: boolean;
  /** Visitors see why this tool needs an account instead of being sent to sign-in. */
  explain?: AccountTool;
}

const ProtectedRoute = ({ children, skipOnboarding = true, explain }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  // The traveler-profile gate is only needed when onboarding is enforced.
  const { data: profile, isLoading: profileLoading } = useTravelerProfile({ enabled: !skipOnboarding });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (explain) return <AccountNeeded tool={explain} />;
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!skipOnboarding) {
    if (profileLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    const step = (profile?.onboarding_step ?? null) as OnboardingStep | null;
    const finished = step === "done" || (!step && !!profile?.completed_at);
    if (!finished) {
      // If no profile row yet, send them to the anonymous Tinder deck at "/".
      const target = step ? stepToRoute(step) : "/";
      if (location.pathname !== target) {
        return <Navigate to={target} replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
