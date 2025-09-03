import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroBackground from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email signup
    console.log("Email signup:", email);
  };

  return (
    <section className="relative pt-20 pb-16 hero-gradient overflow-hidden">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CSS Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Stats Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
              <span className="px-5 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
                100+ Queries Analyzed
              </span>
              <span className="px-5 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">
                Real-Time Insights
              </span>
              <span className="px-5 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                AI-Powered Analytics
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-h1 text-foreground font-semibold mb-6">
              Optimize Your AI Search Presence
            </h1>
            
            {/* Subtitle */}
            <p className="text-body text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Track visibility, citations, and sentiment across leading LLMs – trusted by marketers and brands
            </p>

            {/* Email Signup Form */}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto lg:mx-0 mb-12">
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-card border-border rounded-lg"
                  required
                />
                <Button 
                  type="submit"
                  className="primary-gradient text-white px-6 hover:opacity-90 transition-base"
                >
                  Get Started
                </Button>
              </div>
            </form>

            {/* Trusted By Logos */}
            <div className="mt-12">
              <p className="text-muted-foreground text-sm mb-6">Trusted by leading brands</p>
              <div className="flex items-center justify-center lg:justify-start flex-wrap gap-6 opacity-60">
                {/* Placeholder for company logos - would be replaced with actual logos */}
                {["TechCorp", "DataFlow", "AI Insights", "MarketPro", "BrandLab"].map((company) => (
                  <div 
                    key={company} 
                    className="w-20 h-10 bg-muted-foreground/20 rounded flex items-center justify-center"
                  >
                    <span className="text-xs text-muted-foreground font-medium">{company}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm lg:max-w-md bg-card/90 backdrop-blur-sm rounded-xl shadow-hero border border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-accent h-1"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-muted-foreground">AI Visibility Dashboard</div>
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Visibility Score</span>
                    <span className="text-lg font-semibold text-primary">87%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[87%] bg-gradient-to-r from-primary to-accent rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary">24</div>
                      <div className="text-xs text-muted-foreground">Citations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-accent">156</div>
                      <div className="text-xs text-muted-foreground">Mentions</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Trend</span>
                      <span className="text-success">↗ +12%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;