import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";

const PricingCard = () => {
  const featuredPlan = {
    name: "Pro Plan",
    price: "$49",
    period: "/month", 
    description: "Everything you need for comprehensive website analytics",
    features: [
      "Advanced AI visibility scoring",
      "Real-time website monitoring", 
      "Competitor analysis",
      "Custom reporting & alerts",
      "API access for integrations",
      "Priority support",
      "Export capabilities",
      "Team collaboration tools"
    ]
  };

  return (
    <section className="py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-h2 text-foreground font-semibold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Start optimizing your AI search presence today with our most popular plan
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="shadow-card relative border-primary ring-2 ring-primary/20">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <CardHeader className="text-center pb-4">
              <h3 className="text-h3 text-foreground font-semibold">{featuredPlan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-foreground">{featuredPlan.price}</span>
                <span className="text-muted-foreground">{featuredPlan.period}</span>
              </div>
              <p className="text-caption text-muted-foreground mt-2">{featuredPlan.description}</p>
            </CardHeader>

            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                {featuredPlan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-caption text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link to="/pricing">
                    Get Started
                  </Link>
                </Button>
                
                <Button variant="ghost" className="w-full group" asChild>
                  <Link to="/pricing">
                    View All Plans
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingCard;