import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LoadingBar } from '@/components/ui/loading-bar';
import { callEdgeFunction } from '@/lib/api-client';

export default function Pricing() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to our Pro plan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const data = await callEdgeFunction('create-checkout');

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription failed",
        description: "Unable to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isTrialActive = profile?.subscription_status === 'trial' && 
    profile?.trial_ends_at && 
    new Date(profile.trial_ends_at) > new Date();

  const isPro = profile?.subscription_status === 'active' && profile?.subscription_tier === 'pro';

  const features = [
    "Advanced AI visibility scoring",
    "Real-time website monitoring", 
    "Competitor analysis",
    "Custom reporting & alerts",
    "API access for integrations",
    "Priority support",
    "Export capabilities",
    "Team collaboration tools"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full power of AI-driven website analytics with our Pro plan
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="relative">
            {!isPro && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  <Zap className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Pro Plan</CardTitle>
              <CardDescription className="text-gray-600">
                Everything you need for comprehensive website analytics
              </CardDescription>
              <div className="flex items-baseline justify-center mt-4">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600 ml-1">/month</span>
              </div>
              {isTrialActive && (
                <Badge className="bg-green-100 text-green-700 border-green-200 mt-2">
                  Trial Active - {Math.ceil((new Date(profile!.trial_ends_at!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                </Badge>
              )}
              {isPro && (
                <Badge className="bg-green-100 text-green-700 border-green-200 mt-2">
                  Currently Subscribed
                </Badge>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                {loading && <LoadingBar indeterminate className="mb-4" />}
                
                {isPro ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => window.open('/settings', '_blank')}
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubscribe} 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : isTrialActive ? 'Upgrade to Pro' : 'Start Free Trial'}
                  </Button>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  7-day free trial • Cancel anytime • No hidden fees
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600">
            Have questions? <a href="#" className="text-purple-600 hover:underline">Contact our team</a>
          </p>
        </div>
      </div>
    </div>
  );
}