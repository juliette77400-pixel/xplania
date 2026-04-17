import { useState } from "react";
import Navbar from "@/components/xplania/Navbar";
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
import { useTravelContext } from "@/contexts/TravelContext";
import { hasReachedFreeQuota } from "@/stores/usePlanStore";

const Index = () => {
  const [travelFormOpen, setTravelFormOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const { tripData, setTripData, recommendations, setRecommendations, dashboardLoading, setDashboardLoading } = useTravelContext();

  const handleCreateTrip = () => {
    if (hasReachedFreeQuota()) {
      setQuotaOpen(true);
      return;
    }
    setTravelFormOpen(true);
  };

  const scrollToFeedback = () => {
    const el = document.getElementById("feedback");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCreateTrip={handleCreateTrip} onFeedback={scrollToFeedback} />
      <HeroSection onCreateTrip={handleCreateTrip} />
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
        onTripGenerated={(data, recs) => {
          setTripData(data);
          setRecommendations(recs);
        }}
        onGenerating={setDashboardLoading}
      />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <OnboardingDialog />
      <QuotaReachedDialog open={quotaOpen} onOpenChange={setQuotaOpen} />
    </div>
  );
};

export default Index;
