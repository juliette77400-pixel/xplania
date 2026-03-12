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
import type { TravelFormData, TravelRecommendations } from "@/types/travel";

const Index = () => {
  const [travelFormOpen, setTravelFormOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [tripData, setTripData] = useState<TravelFormData | null>(null);
  const [recommendations, setRecommendations] = useState<TravelRecommendations | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const scrollToFeedback = () => {
    const el = document.getElementById("feedback");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCreateTrip={() => setTravelFormOpen(true)} onFeedback={scrollToFeedback} />
      <HeroSection onCreateTrip={() => setTravelFormOpen(true)} />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <DashboardSection
        onCreateTrip={() => setTravelFormOpen(true)}
        tripData={tripData}
        recommendations={recommendations}
        loading={dashboardLoading}
      />
      <BetaSection onFeedback={() => setFeedbackOpen(true)} />
      <Footer onCreateTrip={() => setTravelFormOpen(true)} />
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
    </div>
  );
};

export default Index;
