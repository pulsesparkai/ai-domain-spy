import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PricingCard = () => {
  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small businesses and startups",
      features: [
        "Track up to 3 domains",
        "Basic AI visibility scoring", 
        "Weekly reports",
        "Email support",
        "Basic competitor analysis"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month", 
      description: "Ideal for growing marketing teams",
      features: [
        "Track up to 10 domains",
        "Advanced AI visibility scoring",
        "Daily reports & real-time alerts",
        "Priority support",
        "Full competitor analysis",
        "Custom sentiment tracking",
        "API access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with advanced needs",
      features: [
        "Unlimited domains",
        "Enterprise AI analytics",
        "Real-time monitoring",
        "Dedicated account manager",
        "Advanced integrations",
        "Custom reporting",
        "White-label options"
      ],
      popular: false
    }
  ];

  return (
    <section className="py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-h2 text-foreground font-semibold mb-4">
            Choose Your Plan
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Start optimizing your AI search presence today with flexible pricing options
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`shadow-card relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <h3 className="text-h3 text-foreground font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-caption text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-caption text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingCard;