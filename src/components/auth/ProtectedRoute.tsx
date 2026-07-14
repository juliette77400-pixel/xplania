import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import { Loader2 } from "lucide-react";
import { stepToRoute, type OnboardingStep } from "@/lib/onboarding-state";

interface Props {
  children: React.ReactNode;
  /** Skip the traveler-profile onboarding gate (used by the onboarding routes themselves). */
  skipOnboarding?: boolean;
}

const ProtectedRoute = ({ children, skipOnboarding = false }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { data: profile, isLoading: profileLoading } = useTravelerProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
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
      // If no profile row yet, send them to the beginning of the tunnel.
      const target = step ? stepToRoute(step) : "/profil-voyageur";
      if (location.pathname !== target) {
        return <Navigate to={target} replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
