import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, User, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ExportButton } from '@/components/ExportButton';

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || ''
  });

  const handleProfileUpdate = async () => {
    if (!profile) return;
    
    try {
      await updateProfile({
        full_name: profileData.full_name
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Unable to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };


  // Mock data for export
  const mockScanData = [
    { query: 'AI analytics tools', platform: 'Perplexity', sentiment: 'positive', rank: 3 },
    { query: 'search optimization', platform: 'ChatGPT', sentiment: 'neutral', rank: 8 },
    { query: 'marketing analytics', platform: 'Claude', sentiment: 'positive', rank: 15 }
  ];

  const isSubscribed = profile?.subscription_status === 'active';
  const subscriptionTier = profile?.subscription_tier || 'free';
  const scansUsed = profile?.monthly_scans_used || 0;
  const scansLimit = profile?.monthly_scans_limit || 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Email cannot be changed from here
                    </p>
                  </div>
                  <Button onClick={handleProfileUpdate} className="bg-primary hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage & Limits</CardTitle>
                  <CardDescription>
                    Track your current usage and subscription status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Subscription Status</span>
                    <Badge variant={isSubscribed ? 'default' : 'secondary'}>
                      {isSubscribed ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1) : 'Free'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Scans Used This Month</span>
                    <Badge variant="outline">
                      {scansUsed} / {scansLimit === 0 ? '∞' : scansLimit}
                    </Badge>
                  </div>
                  <ExportButton 
                    data={mockScanData} 
                    filename="scan-results"
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>
                    Manage your billing and subscription preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Current Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        {isSubscribed 
                          ? `${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan`
                          : 'Free Plan'
                        }
                      </p>
                    </div>
                    <Badge variant={isSubscribed ? 'default' : 'secondary'}>
                      {isSubscribed ? 'Active' : 'Free'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Features Included:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {scansLimit === 0 ? 'Unlimited' : `Up to ${scansLimit}`} scans per month</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Advanced AI analytics</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Competitor analysis</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Priority support</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => toast({ title: "Coming Soon", description: "Billing management will be available soon." })}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Manage Billing
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}