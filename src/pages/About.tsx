import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { MainContent } from "@/components/SkipToContent";

const About = () => {
  useEffect(() => {
    analytics.page('About');
  }, []);

  return (
    <MainContent>
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-8">About Us</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              PulseSpark AI is an innovative AI-powered SEO tool designed to help businesses 
              optimize their online presence and improve their search engine rankings.
            </p>
            
            <p className="text-muted-foreground mb-6">
              Our cutting-edge technology combines artificial intelligence with comprehensive 
              SEO analysis to provide actionable insights that drive real results. Whether 
              you're a small business owner, digital marketer, or enterprise company, 
              PulseSpark AI empowers you to make data-driven decisions that boost your 
              website's visibility and performance.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-6">
              To democratize access to advanced SEO insights and make professional-grade 
              optimization tools available to businesses of all sizes. We believe that 
              every website deserves to be discovered by its target audience.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Why Choose PulseSpark AI?</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>AI-powered analysis for precise SEO recommendations</li>
              <li>Real-time monitoring and tracking capabilities</li>
              <li>User-friendly interface designed for all skill levels</li>
              <li>Comprehensive reporting and analytics</li>
              <li>Continuous updates to stay ahead of search engine algorithms</li>
            </ul>
          </div>
        </div>
      </div>
    </MainContent>
  );
};

export default About;