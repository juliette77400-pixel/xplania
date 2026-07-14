import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
const GlobalPipChat = lazy(() => import("./components/shared/GlobalPipChat"));
import PipChatSkeleton from "./components/shared/PipChatSkeleton";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import OnboardingSyncGate from "./components/onboarding/OnboardingSyncGate";

// The Tinder deck is now the anonymous landing screen at "/". Keep it eager
// so first paint is fast. The classic marketing landing moves to "/home".
import TravelerProfileOnboarding from "./pages/TravelerProfileOnboarding.tsx";
const Index = lazy(() => import("./pages/Index.tsx"));

// All other routes are code-split so their JS (and heavy libs such as
// leaflet / recharts / framer-motion) is only fetched when the route is visited.
const GuideBudget = lazy(() => import("./pages/GuideBudget.tsx"));
const GuideValise = lazy(() => import("./pages/GuideValise.tsx"));
const GuideVisa = lazy(() => import("./pages/GuideVisa.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Offres = lazy(() => import("./pages/Offres.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Carnets = lazy(() => import("./pages/Carnets.tsx"));
const Carnet = lazy(() => import("./pages/Carnet.tsx"));
const PublicCarnet = lazy(() => import("./pages/PublicCarnet.tsx"));
const Suivi = lazy(() => import("./pages/Suivi.tsx"));
const SuiviTrip = lazy(() => import("./pages/SuiviTrip.tsx"));
const PublicSuivi = lazy(() => import("./pages/PublicSuivi.tsx"));
const Explore = lazy(() => import("./pages/Explore.tsx"));
const ExploreTrip = lazy(() => import("./pages/ExploreTrip.tsx"));
const MoodExplorer = lazy(() => import("./pages/MoodExplorer.tsx"));
const Discover = lazy(() => import("./pages/Discover.tsx"));
const Gamification = lazy(() => import("./pages/Gamification.tsx"));
const AdminBadges = lazy(() => import("./pages/AdminBadges.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Profil = lazy(() => import("./pages/Profil.tsx"));
const Parametres = lazy(() => import("./pages/Parametres.tsx"));
const Legal = lazy(() => import("./pages/Legal.tsx"));
const Trust = lazy(() => import("./pages/Trust.tsx"));
const About = lazy(() => import("./pages/About.tsx"));

const TravelerProfileResult = lazy(() => import("./pages/TravelerProfileResult.tsx"));
const TravelerProfileAdjust = lazy(() => import("./pages/TravelerProfileAdjust.tsx"));
const Destinations = lazy(() => import("./pages/Destinations.tsx"));
const HiddenGems = lazy(() => import("./pages/HiddenGems.tsx"));
const AdminSeedRag = lazy(() => import("./pages/AdminSeedRag.tsx"));
const OnbWelcome = lazy(() => import("./pages/onboarding/Welcome.tsx"));
const OnbBesoin = lazy(() => import("./pages/onboarding/Besoin.tsx"));
const OnbQualif = lazy(() => import("./pages/onboarding/Qualif.tsx"));
const OnbSignup = lazy(() => import("./pages/onboarding/Signup.tsx"));
const OnbFeatures = lazy(() => import("./pages/onboarding/Features.tsx"));
const OnbEssai = lazy(() => import("./pages/onboarding/Essai.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 1 min before considering it stale, keep it 5 min in memory.
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Chargement" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary showHomeLink>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* New onboarding tunnel (public until signup) */}
            <Route path="/welcome" element={<OnbWelcome />} />
            <Route path="/onboarding/besoin" element={<OnbBesoin />} />
            <Route path="/onboarding/qualif" element={<OnbQualif />} />
            <Route path="/onboarding/signup" element={<OnbSignup />} />
            <Route path="/profil-voyageur" element={<ProtectedRoute skipOnboarding><TravelerProfileOnboarding /></ProtectedRoute>} />
            <Route path="/profil-voyageur/resultat" element={<ProtectedRoute skipOnboarding><TravelerProfileResult /></ProtectedRoute>} />
            <Route path="/profil-voyageur/features" element={<ProtectedRoute skipOnboarding><OnbFeatures /></ProtectedRoute>} />
            <Route path="/profil-voyageur/essai" element={<ProtectedRoute skipOnboarding><OnbEssai /></ProtectedRoute>} />
            <Route path="/profil-voyageur/ajuster" element={<ProtectedRoute><TravelerProfileAdjust /></ProtectedRoute>} />
            <Route path="/destinations" element={<ProtectedRoute><Destinations /></ProtectedRoute>} />
            <Route path="/hidden-gems" element={<ProtectedRoute><HiddenGems /></ProtectedRoute>} />
            <Route path="/guide-budget" element={<GuideBudget />} />
            <Route path="/guide-valise" element={<ProtectedRoute><GuideValise /></ProtectedRoute>} />
            <Route path="/guide-visa" element={<GuideVisa />} />
            <Route path="/offres" element={<Offres />} />
            <Route path="/carnets" element={<ProtectedRoute><Carnets /></ProtectedRoute>} />
            <Route path="/carnet/:tripId" element={<ProtectedRoute><Carnet /></ProtectedRoute>} />
            <Route path="/carnet/public/:slug" element={<PublicCarnet />} />
            <Route path="/suivi" element={<ProtectedRoute><Suivi /></ProtectedRoute>} />
            <Route path="/suivi/:tripId" element={<ProtectedRoute><SuiviTrip /></ProtectedRoute>} />
            <Route path="/suivi/public/:slug" element={<PublicSuivi />} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/explore/:tripId" element={<ProtectedRoute><ExploreTrip /></ProtectedRoute>} />
            <Route path="/mood" element={<ProtectedRoute><MoodExplorer /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
            <Route path="/admin/badges" element={<ProtectedRoute><AdminBadges /></ProtectedRoute>} />
            <Route path="/admin/seed-rag" element={<ProtectedRoute><AdminSeedRag /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/a-propos" element={<About />} />
            {/* Localized legal routes (FR + EN canonical URLs) */}
            <Route path="/mentions-legales" element={<Legal legalKey="mentions" />} />
            <Route path="/legal-notice" element={<Legal legalKey="mentions" />} />
            <Route path="/politique-de-confidentialite" element={<Legal legalKey="confidentialite" />} />
            <Route path="/privacy-policy" element={<Legal legalKey="confidentialite" />} />
            <Route path="/conditions-utilisation" element={<Legal legalKey="cgu" />} />
            <Route path="/terms-of-use" element={<Legal legalKey="cgu" />} />
            <Route path="/trust" element={<Trust />} />
            <Route path="/securite" element={<Trust />} />
            {/* Legacy fallback */}
            <Route path="/legal" element={<Legal />} />
            <Route path="/legal/:type" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <Suspense fallback={<PipChatSkeleton />}><GlobalPipChat /></Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
