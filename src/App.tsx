import OfflineBanner from "@/components/shared/OfflineBanner";
import ReportAiButton from "@/components/shared/ReportAiButton";
import RouteMeta from "@/components/shared/RouteMeta";
import i18n from "@/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
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
import AdminGate from "./components/admin/AdminGate";
import HelpButton from "@/components/shared/HelpButton";
const CookieBanner = lazy(() => import("./components/shared/CookieBanner"));
import RouteTracker from "./components/shared/RouteTracker";
import { FEATURE_FLAGS, PREPARATION_HOME, type FeatureFlag } from "@/config/featureFlags";

/** Renders the page only when its module is on; otherwise sends the visitor
 *  to the preparation dashboard. The lazy page is never rendered (so never
 *  downloaded) while its flag is off. */
const gate = (flag: FeatureFlag, element: JSX.Element) =>
  FEATURE_FLAGS[flag] ? element : <Navigate to={PREPARATION_HOME} replace />;

// The Tinder deck is now the anonymous landing screen at "/". Keep it eager
// so first paint is fast. The classic marketing landing moves to "/home".
const TravelerProfileOnboarding = lazy(() => import("./pages/TravelerProfileOnboarding.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));

// All other routes are code-split so their JS (and heavy libs such as
// leaflet / recharts / framer-motion) is only fetched when the route is visited.
const GuideBudget = lazy(() => import("./pages/GuideBudget.tsx"));
const GuideValise = lazy(() => import("./pages/GuideValise.tsx"));
const GuideVisa = lazy(() => import("./pages/GuideVisa.tsx"));
const GuideCulture = lazy(() => import("./pages/GuideCulture.tsx"));
const GuideLogement = lazy(() => import("./pages/GuideLogement.tsx"));
const PrepQuiz = lazy(() => import("./pages/PrepQuiz.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Offres = lazy(() => import("./pages/Offres.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Carnets = lazy(() => import("./pages/Carnets.tsx"));
const Carnet = lazy(() => import("./pages/Carnet.tsx"));
const PublicCarnet = lazy(() => import("./pages/PublicCarnet.tsx"));
const PublicList = lazy(() => import("./pages/PublicList.tsx"));
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
const Schools = lazy(() => import("./pages/Schools.tsx"));
const XplaniaVsChatgpt = lazy(() => import("./pages/XplaniaVsChatgpt.tsx"));
const GuidePlanTrip = lazy(() => import("./pages/GuidePlanTrip.tsx"));

const TravelerProfileResult = lazy(() => import("./pages/TravelerProfileResult.tsx"));
const TravelerProfileAdjust = lazy(() => import("./pages/TravelerProfileAdjust.tsx"));
const Destinations = lazy(() => import("./pages/Destinations.tsx"));
const HiddenGems = lazy(() => import("./pages/HiddenGems.tsx"));
const AdminSeedRag = lazy(() => import("./pages/AdminSeedRag.tsx"));
const AdminStats = lazy(() => import("./pages/AdminStats.tsx"));
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
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={i18n.t("ui2.auto.k1")} />
  </div>
);

const App = () => (
  <MotionConfig reducedMotion="user">
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ErrorBoundary showHomeLink>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
            >
              {i18n.t("a11y.skipToContent")}
            </a>
            <RouteMeta />
            <ReportAiButton />
            <RouteTracker />
            {FEATURE_FLAGS.ENABLE_TRAVELER_DNA && <OnboardingSyncGate />}
            <AdminGate />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Anonymous Tinder deck is now the landing page. */}
              <Route path="/" element={<Index />} />
              <Route path="/parcours" element={gate("ENABLE_TRAVELER_DNA", <TravelerProfileOnboarding />)} />
              <Route path="/home" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Legacy onboarding routes (kept public for backward compat) */}
            <Route path="/welcome" element={gate("ENABLE_TRAVELER_DNA", <OnbWelcome />)} />
            <Route path="/onboarding/besoin" element={gate("ENABLE_TRAVELER_DNA", <OnbBesoin />)} />
            <Route path="/onboarding/qualif" element={gate("ENABLE_TRAVELER_DNA", <OnbQualif />)} />
            <Route path="/onboarding/signup" element={gate("ENABLE_TRAVELER_DNA", <OnbSignup />)} />
            {/* The Tinder deck lives at "/" now — keep this legacy path as a redirect. */}
            <Route path="/profil-voyageur" element={gate("ENABLE_TRAVELER_DNA", <TravelerProfileOnboarding />)} />
            <Route path="/profil-voyageur/resultat" element={gate("ENABLE_TRAVELER_DNA", <TravelerProfileResult />)} />
            <Route path="/profil-voyageur/features" element={gate("ENABLE_TRAVELER_DNA", <ProtectedRoute skipOnboarding><OnbFeatures /></ProtectedRoute>)} />
            <Route path="/profil-voyageur/essai" element={gate("ENABLE_TRAVELER_DNA", <ProtectedRoute skipOnboarding><OnbEssai /></ProtectedRoute>)} />

            <Route path="/profil-voyageur/ajuster" element={gate("ENABLE_TRAVELER_DNA", <ProtectedRoute><TravelerProfileAdjust /></ProtectedRoute>)} />
            <Route path="/destinations" element={gate("ENABLE_DISCOVER", <ProtectedRoute><Destinations /></ProtectedRoute>)} />
            <Route path="/hidden-gems" element={gate("ENABLE_DISCOVER", <ProtectedRoute><HiddenGems /></ProtectedRoute>)} />
            <Route path="/guide-budget" element={gate("ENABLE_BUDGET_GUIDE", <GuideBudget />)} />
            <Route path="/guide-valise" element={gate("ENABLE_PACKING_LIST", <ProtectedRoute><GuideValise /></ProtectedRoute>)} />
            <Route path="/guide-visa" element={gate("ENABLE_VISA_GUIDE", <GuideVisa />)} />
            <Route path="/guide-culture" element={gate("ENABLE_CULTURAL_GUIDE", <GuideCulture />)} />
            <Route path="/guide-logement" element={gate("ENABLE_HOUSING_ASSISTANT", <ProtectedRoute><GuideLogement /></ProtectedRoute>)} />
            <Route path="/offres" element={<Offres />} />
            <Route path="/carnets" element={gate("ENABLE_TRAVEL_JOURNAL", <ProtectedRoute><Carnets /></ProtectedRoute>)} />
            <Route path="/carnet/:tripId" element={gate("ENABLE_TRAVEL_JOURNAL", <ProtectedRoute><Carnet /></ProtectedRoute>)} />
            <Route path="/carnet/public/:slug" element={gate("ENABLE_TRAVEL_JOURNAL", <PublicCarnet />)} />
            <Route path="/liste/:slug" element={gate("ENABLE_DISCOVER", <PublicList />)} />
            <Route path="/suivi" element={gate("ENABLE_LIVE_TRACKING", <ProtectedRoute><Suivi /></ProtectedRoute>)} />
            <Route path="/suivi/:tripId" element={gate("ENABLE_LIVE_TRACKING", <ProtectedRoute><SuiviTrip /></ProtectedRoute>)} />
            <Route path="/suivi/public/:slug" element={gate("ENABLE_LIVE_TRACKING", <PublicSuivi />)} />
            <Route path="/explore" element={gate("ENABLE_AI_ITINERARY", <ProtectedRoute><Explore /></ProtectedRoute>)} />
            <Route path="/explore/:tripId" element={gate("ENABLE_AI_ITINERARY", <ProtectedRoute><ExploreTrip /></ProtectedRoute>)} />
            <Route path="/mood" element={gate("ENABLE_MOOD_EXPLORER", <ProtectedRoute><MoodExplorer /></ProtectedRoute>)} />
            <Route path="/discover" element={gate("ENABLE_DISCOVER", <ProtectedRoute><Discover /></ProtectedRoute>)} />
            <Route path="/gamification" element={gate("ENABLE_GAMIFICATION", <ProtectedRoute><Gamification /></ProtectedRoute>)} />
            <Route path="/admin/badges" element={gate("ENABLE_GAMIFICATION", <ProtectedRoute><AdminBadges /></ProtectedRoute>)} />
            <Route path="/admin/seed-rag" element={<ProtectedRoute><AdminSeedRag /></ProtectedRoute>} />
            <Route path="/admin/stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/preparation" element={<ProtectedRoute><PrepQuiz /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
            <Route path="/blog/how-to-plan-a-trip-with-ai" element={gate("ENABLE_AI_ITINERARY", <GuidePlanTrip />)} />
            <Route path="/xplania-vs-chatgpt" element={<XplaniaVsChatgpt />} />
            {/* Canonical FR routes. EN duplicate slugs redirect to the FR canonical URL. */}
            <Route path="/a-propos" element={<About />} />
            <Route path="/ecoles" element={<Schools />} />
            <Route path="/schools" element={<Navigate to="/ecoles" replace />} />
            <Route path="/about" element={<Navigate to="/a-propos" replace />} />
            {/* Localized legal routes: FR is canonical, EN slugs redirect */}
            <Route path="/mentions-legales" element={<Legal legalKey="mentions" />} />
            <Route path="/legal-notice" element={<Navigate to="/mentions-legales" replace />} />
            <Route path="/politique-de-confidentialite" element={<Legal legalKey="confidentialite" />} />
            <Route path="/privacy-policy" element={<Navigate to="/politique-de-confidentialite" replace />} />
            <Route path="/conditions-utilisation" element={<Legal legalKey="cgu" />} />
            <Route path="/terms-of-use" element={<Navigate to="/conditions-utilisation" replace />} />
            <Route path="/securite" element={<Trust />} />
            <Route path="/trust" element={<Navigate to="/securite" replace />} />
            {/* Legacy fallback */}
            <Route path="/legal" element={<Legal />} />
            <Route path="/legal/:type" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <Suspense fallback={<PipChatSkeleton />}><GlobalPipChat /></Suspense>
            <Suspense fallback={null}><CookieBanner /></Suspense>
            <HelpButton />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </MotionConfig>
);

export default App;
