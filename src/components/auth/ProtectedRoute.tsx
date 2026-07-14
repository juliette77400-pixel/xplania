import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  /** Skip the traveler-profile onboarding gate (used by the onboarding routes themselves). */
  skipOnboarding?: boolean;
}

const ProtectedRoute = ({ children, skipOnboarding = false }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Only fire the query when we already know we have a user; gate below.
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
    if (!profile?.completed_at) {
      return <Navigate to="/profil-voyageur" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
