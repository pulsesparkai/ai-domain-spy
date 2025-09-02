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
      
      {/* Dashboard Screenshot Overlay */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <div className="w-80 h-48 bg-card/80 backdrop-blur-sm rounded-xl shadow-hero border border-border/50">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <div className="w-3 h-3 bg-success rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-primary/20 rounded"></div>
              <div className="h-3 bg-accent/20 rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center lg:text-left lg:max-w-2xl">
          {/* Stats Badges */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
            <span className="stats-badge">98% Citation Accuracy</span>
            <span className="stats-badge">500K+ Queries Tracked</span>
            <span className="stats-badge">Real-time Monitoring</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-h1 text-foreground font-semibold mb-6">
            Optimize Your AI Search Presence
          </h1>
          
          {/* Subtitle */}
          <p className="text-body text-muted-foreground mb-8 max-w-xl">
            Track visibility, citations, and sentiment across leading LLMs – trusted by marketers and brands
          </p>

          {/* Email Signup Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-12">
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
            <div className="flex items-center justify-center space-x-8 opacity-60">
              {/* Placeholder for company logos - would be replaced with actual logos */}
              {["TechCorp", "DataFlow", "AI Insights", "MarketPro", "BrandLab"].map((company) => (
                <div 
                  key={company} 
                  className="w-24 h-12 bg-muted-foreground/20 rounded flex items-center justify-center"
                >
                  <span className="text-xs text-muted-foreground font-medium">{company}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;