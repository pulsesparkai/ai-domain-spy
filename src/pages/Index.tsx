import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import PricingCard from "@/components/PricingCard";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesGrid />
      <PricingCard />
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
