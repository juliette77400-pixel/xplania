import Navbar from "@/components/xplania/Navbar";
import HeroSection from "@/components/xplania/HeroSection";
import FeaturesSection from "@/components/xplania/FeaturesSection";
import HowItWorksSection from "@/components/xplania/HowItWorksSection";
import BenefitsSection from "@/components/xplania/BenefitsSection";
import DashboardSection from "@/components/xplania/DashboardSection";
import BetaSection from "@/components/xplania/BetaSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <DashboardSection />
      <BetaSection />
    </div>
  );
};

export default Index;
