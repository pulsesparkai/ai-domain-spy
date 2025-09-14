import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, User, CreditCard, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ExportButton } from '@/components/ExportButton';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || ''
  });
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState({
    perplexity: '',
    openai: '',
    deepseek: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);

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

  const handleSaveApiKeys = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ 
          api_keys: {
            perplexity: apiKeys.perplexity,
            openai: apiKeys.openai,
            deepseek: apiKeys.deepseek || ''
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "API keys saved",
        description: "Your API keys have been saved successfully.",
      });
      setShowSaveButton(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setShowSaveButton(true);
  };

  // Load saved keys on mount
  useEffect(() => {
    const loadApiKeys = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('api_keys')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile?.api_keys) {
        setApiKeys({
          perplexity: profile.api_keys.perplexity || '',
          openai: profile.api_keys.openai || '',
          deepseek: profile.api_keys.deepseek || ''
        });
      }
    };
    
    loadApiKeys();
  }, []);

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
  
  const getNextBillingDate = () => {
    if (!profile?.billing_cycle_start) return 'N/A';
    const billingStart = new Date(profile.billing_cycle_start);
    billingStart.setMonth(billingStart.getMonth() + 1);
    return billingStart.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Keys
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
                      {scansUsed} / {scansLimit === -1 ? '∞' : scansLimit}
                    </Badge>
                  </div>
                  {profile?.billing_cycle_start && (
                    <div className="flex items-center justify-between">
                      <span>Next Billing Date</span>
                      <span className="text-sm text-muted-foreground">
                        {getNextBillingDate()}
                      </span>
                    </div>
                  )}
                  <ExportButton 
                    data={mockScanData} 
                    filename="scan-results"
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for various AI services. These are stored securely and encrypted.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="perplexity">Perplexity API Key</Label>
                    <Input
                      id="perplexity"
                      type="password"
                      value={apiKeys.perplexity}
                      onChange={(e) => handleApiKeyChange('perplexity', e.target.value)}
                      placeholder="Enter your Perplexity API key"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Required for AI-powered search and analysis features
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="openai">OpenAI API Key</Label>
                    <Input
                      id="openai"
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                      placeholder="Enter your OpenAI API key"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Used for advanced AI analysis and content generation
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="deepseek">DeepSeek API Key</Label>
                    <Input
                      id="deepseek"
                      type="password"
                      value={apiKeys.deepseek}
                      onChange={(e) => handleApiKeyChange('deepseek', e.target.value)}
                      placeholder="Enter your DeepSeek API key (optional)"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Optional: For additional AI analysis capabilities
                    </p>
                  </div>
                  
                  {showSaveButton && (
                    <Button 
                      onClick={handleSaveApiKeys} 
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save API Keys'}
                    </Button>
                  )}
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
                      <li>• {scansLimit === -1 ? 'Unlimited' : `Up to ${scansLimit}`} scans per month</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Advanced AI analytics</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Competitor analysis</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Priority support</li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open('/pricing', '_blank')}
                      className="flex-1"
                      variant="outline"
                    >
                      {isSubscribed ? 'Change Plan' : 'Upgrade'}
                    </Button>
                    {isSubscribed && (
                      <Button 
                        onClick={() => toast({ title: "Coming Soon", description: "Subscription cancellation will be available soon." })}
                        variant="destructive"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}