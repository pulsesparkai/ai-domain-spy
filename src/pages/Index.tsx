import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import SolutionsSection from "@/components/SolutionsSection";
import { TestimonialsSection, FAQSection } from "@/components/TestimonialsAndFAQ";
import PricingCard from "@/components/PricingCard";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

const Index = () => {
  useEffect(() => {
    // Track page view
    analytics.page('Homepage');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesGrid />
      <SolutionsSection />
      <TestimonialsSection />
      <FAQSection />
      <PricingCard />
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
