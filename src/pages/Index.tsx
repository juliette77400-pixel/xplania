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

const Index = () => {
  const [travelFormOpen, setTravelFormOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCreateTrip={() => setTravelFormOpen(true)} onFeedback={() => setFeedbackOpen(true)} />
      <HeroSection onCreateTrip={() => setTravelFormOpen(true)} />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <DashboardSection onCreateTrip={() => setTravelFormOpen(true)} />
      <BetaSection onFeedback={() => setFeedbackOpen(true)} />
      <Footer onFeedback={() => setFeedbackOpen(true)} onCreateTrip={() => setTravelFormOpen(true)} />
      <TravelFormDialog open={travelFormOpen} onOpenChange={setTravelFormOpen} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};

export default Index;
