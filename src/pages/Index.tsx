import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppNavbar from "@/components/shared/AppNavbar";
import HeroSection from "@/components/xplania/HeroSection";
import FeaturesSection from "@/components/xplania/FeaturesSection";
import HowItWorksSection from "@/components/xplania/HowItWorksSection";
import BenefitsSection from "@/components/xplania/BenefitsSection";
import DashboardSection from "@/components/xplania/DashboardSection";
import BetaSection from "@/components/xplania/BetaSection";
import Footer from "@/components/xplania/Footer";
import TravelFormDialog from "@/components/xplania/TravelFormDialog";
import FeedbackDialog from "@/components/xplania/FeedbackDialog";
import OnboardingDialog from "@/components/xplania/OnboardingDialog";
import QuotaReachedDialog from "@/components/xplania/QuotaReachedDialog";
import QuickJump from "@/components/shared/QuickJump";
import { useTravelContext } from "@/contexts/TravelContext";
import { hasReachedFreeQuota } from "@/stores/usePlanStore";
import { useActiveTrip } from "@/stores/useActiveTrip";

const DEMO_PRESET = {
  mode: "quick" as const,
  data: {
    destination: "Lisbonne, Portugal",
    arrivalCity: "Lisbonne",
    departureLocation: "Paris",
    duration: "4",
    totalBudget: 800,
    tripTypes: ["culturel", "gastronomique"],
    travelerType: "couple",
  },
};

const Index = () => {
  const [travelFormOpen, setTravelFormOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const { tripData, setTripData, recommendations, setRecommendations, dashboardLoading, setDashboardLoading } = useTravelContext();
  const setActiveTrip = useActiveTrip((s) => s.setActiveTrip);

  const handleCreateTrip = () => {
    if (hasReachedFreeQuota()) {
      setQuotaOpen(true);
      return;
    }
    setDemoMode(false);
    setTravelFormOpen(true);
  };

  const handleDemoTrip = () => {
    setDemoMode(true);
    setTravelFormOpen(true);
  };

  const scrollToFeedback = () => {
    const el = document.getElementById("feedback");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      {/* legacy hidden CTA — keep handlers wired via floating button below if needed */}
      <div className="hidden">
        <button onClick={handleCreateTrip}>create</button>
        <button onClick={scrollToFeedback}>fb</button>
      </div>
      <HeroSection onCreateTrip={handleCreateTrip} onDemoTrip={handleDemoTrip} />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <DashboardSection
        onCreateTrip={handleCreateTrip}
        tripData={tripData}
        recommendations={recommendations}
        loading={dashboardLoading}
      />
      <BetaSection onFeedback={() => setFeedbackOpen(true)} />
      <Footer onCreateTrip={handleCreateTrip} />
      <TravelFormDialog
        open={travelFormOpen}
        onOpenChange={setTravelFormOpen}
        initialPreset={demoMode ? DEMO_PRESET : undefined}
        onTripGenerated={async (data, recs) => {
          setTripData(data);
          setRecommendations(recs);
          if (user) {
            const { data: trip } = await supabase
              .from("trips")
              .insert({
                user_id: user.id,
                title: t("index.tripTitle", { destination: data.destination }),
                destination: data.destination,
                arrival_city: data.arrivalCity,
                departure_location: data.departureLocation,
                departure_date: data.departureDate || null,
                return_date: data.returnDate || null,
                duration: data.duration ? parseInt(data.duration) : null,
                form_data: data as any,
                recommendations: recs as any,
              })
              .select("id")
              .single();
            if (trip) {
              setCurrentTripId(trip.id);
              setActiveTrip({
                tripId: trip.id,
                destination: data.destination,
                arrivalCity: data.arrivalCity,
                departureDate: data.departureDate || null,
                returnDate: data.returnDate || null,
              });
            }
          }
        }}
        onGenerating={setDashboardLoading}
      />
      {currentTripId && (
        <a
          href={`/carnet/${currentTripId}`}
          className="fixed bottom-6 right-6 gradient-button px-5 py-3 rounded-full text-primary-foreground font-semibold shadow-lg hover:scale-105 transition flex items-center gap-2 z-40"
        >
          {t("index.openJournal")}
        </a>
      )}
      <QuickJump />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <OnboardingDialog />
      <QuotaReachedDialog open={quotaOpen} onOpenChange={setQuotaOpen} />
    </div>
  );
};

export default Index;
