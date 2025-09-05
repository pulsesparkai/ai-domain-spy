import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const tiers = [
  {
    name: 'Starter',
    price: '$29',
    period: 'month',
    features: [
      '50 domain scans per month',
      'Basic visibility tracking',
      'Email support',
      '7-day data retention'
    ],
    scansLimit: 50,
    stripePriceId: 'price_starter_monthly'
  },
  {
    name: 'Pro',
    price: '$99',
    period: 'month',
    features: [
      '200 domain scans per month',
      'Advanced analytics',
      'Priority support',
      '30-day data retention',
      'API access'
    ],
    scansLimit: 200,
    stripePriceId: 'price_pro_monthly',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: 'month',
    features: [
      'Unlimited scans',
      'Custom analytics',
      'Dedicated support',
      'Unlimited data retention',
      'API access',
      'Custom integrations'
    ],
    scansLimit: -1, // -1 means unlimited
    stripePriceId: 'price_enterprise_monthly'
  }
];

export default function Pricing() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: typeof tiers[0]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(tier.stripePriceId);
    
    try {
      // This would integrate with Stripe checkout
      // For now, just show a placeholder
      toast({
        title: "Coming Soon",
        description: `${tier.name} subscription will be available soon.`,
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription failed",
        description: "Unable to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const isCurrentTier = (tierName: string) => {
    return profile?.subscription_tier === tierName.toLowerCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Scale your AI visibility tracking with flexible pricing designed for businesses of all sizes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`relative ${tier.popular ? 'border-primary shadow-lg' : ''}`}>
              {tier.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-foreground">{tier.name}</CardTitle>
                <CardDescription className="text-muted-foreground mb-4">
                  {tier.name === 'Starter' && 'Perfect for small businesses getting started'}
                  {tier.name === 'Pro' && 'Ideal for growing companies'}
                  {tier.name === 'Enterprise' && 'For large organizations with custom needs'}
                </CardDescription>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground ml-1">/{tier.period}</span>
                </div>
                {isCurrentTier(tier.name) && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 mt-2">
                    Current Plan
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => handleSubscribe(tier)} 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    disabled={loading === tier.stripePriceId || isCurrentTier(tier.name)}
                  >
                    {loading === tier.stripePriceId ? (
                      'Processing...'
                    ) : isCurrentTier(tier.name) ? (
                      'Current Plan'
                    ) : (
                      `Get ${tier.name}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Need a custom plan? <a href="#" className="text-primary hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
}