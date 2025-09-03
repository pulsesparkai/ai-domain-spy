import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Success() {
  const { refreshProfile } = useAuth();

  useEffect(() => {
    // Refresh user profile to get updated subscription status
    refreshProfile();
  }, [refreshProfile]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing to PulseSpark.ai Pro
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your subscription has been activated and you now have access to all Pro features.
          </p>
          <div className="space-y-2">
            <Link to="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" className="w-full">Manage Subscription</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}