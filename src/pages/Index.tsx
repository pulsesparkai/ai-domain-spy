import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import SolutionsSection from "@/components/SolutionsSection";
import { TestimonialsSection, FAQSection } from "@/components/TestimonialsAndFAQ";
import PricingCard from "@/components/PricingCard";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { MainContent } from "@/components/SkipToContent";
import { KeyboardNavigationProvider } from "@/components/KeyboardNavigation";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

const Index = () => {
  useEffect(() => {
    // Track page view
    analytics.page('Homepage');
  }, []);

  return (
    <KeyboardNavigationProvider>
      <div className="min-h-screen bg-background">
        <Navigation />
        <MainContent>
          <HeroSection />
          <FeaturesGrid />
          <SolutionsSection />
          <TestimonialsSection />
          <FAQSection />
          <PricingCard />
        </MainContent>
        <Footer />
        <CookieConsent />
      </div>
    </KeyboardNavigationProvider>
  );
};

export default Index;
