import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaywallOverlayProps {
  children: React.ReactNode;
}

export function PaywallOverlay({ children }: PaywallOverlayProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isTrialActive = profile?.subscription_status === 'trial' && 
    profile?.trial_ends_at && 
    new Date(profile.trial_ends_at) > new Date();

  const isPro = profile?.subscription_status === 'active' && profile?.subscription_tier === 'pro';

  const hasAccess = isPro || isTrialActive;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none opacity-50">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="text-xl">Upgrade to Pro</CardTitle>
            <CardDescription>
              Unlock advanced analytics features with our Pro plan
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
              <p>• AI-powered insights and recommendations</p>
              <p>• Advanced competitor analysis</p>
              <p>• Custom reports and alerts</p>
              <p>• API access for integrations</p>
            </div>
            <Button 
              onClick={() => navigate('/pricing')} 
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Upgrade to Pro - $49/month
            </Button>
            <p className="text-xs text-gray-500">
              7-day free trial • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}