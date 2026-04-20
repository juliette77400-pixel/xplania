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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
