import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import GuideBudget from "./pages/GuideBudget.tsx";
import GuideValise from "./pages/GuideValise.tsx";
import GuideVisa from "./pages/GuideVisa.tsx";
import NotFound from "./pages/NotFound.tsx";
import Offres from "./pages/Offres.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Carnets from "./pages/Carnets.tsx";
import Carnet from "./pages/Carnet.tsx";
import PublicCarnet from "./pages/PublicCarnet.tsx";
import Suivi from "./pages/Suivi.tsx";
import SuiviTrip from "./pages/SuiviTrip.tsx";
import PublicSuivi from "./pages/PublicSuivi.tsx";
import Explore from "./pages/Explore.tsx";
import ExploreTrip from "./pages/ExploreTrip.tsx";
import MoodExplorer from "./pages/MoodExplorer.tsx";
import Discover from "./pages/Discover.tsx";
import Gamification from "./pages/Gamification.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profil from "./pages/Profil.tsx";
import Legal from "./pages/Legal.tsx";
import About from "./pages/About.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/guide-budget" element={<GuideBudget />} />
            <Route path="/guide-valise" element={<GuideValise />} />
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
            <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/legal/:type" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
