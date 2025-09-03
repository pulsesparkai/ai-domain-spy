import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, User, Key, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DevModeToggle from '@/components/DevModeToggle';
import { ExportButton } from '@/components/ExportButton';
import { ApiKeyValidator } from '@/components/ApiKeyValidator';

export default function Settings() {
  const { user, profile, updateProfile, updateApiKeys, apiKeys: currentApiKeys } = useAuth();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || ''
  });

  // API keys state
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    perplexity: '',
    google_analytics: '',
    screaming_frog: ''
  });

  // Visibility state for API keys
  const [showKeys, setShowKeys] = useState({
    openai: false,
    perplexity: false,
    google_analytics: false,
    screaming_frog: false
  });

  // Load existing API keys from the new encrypted storage
  useEffect(() => {
    if (currentApiKeys) {
      setApiKeys({
        openai: currentApiKeys.openai || '',
        perplexity: currentApiKeys.perplexity || '',
        google_analytics: currentApiKeys.google_analytics || '',
        screaming_frog: currentApiKeys.screaming_frog || ''
      });
    }
  }, [currentApiKeys]);

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

  const handleApiKeysUpdate = async () => {
    try {
      await updateApiKeys(apiKeys);
      toast({
        title: "API keys updated",
        description: "Your API keys have been encrypted and saved securely.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Unable to save API keys. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleKeyVisibility = (key: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    return key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : key;
  };

  // Mock data for export
  const mockScanData = [
    { query: 'AI analytics tools', platform: 'Perplexity', sentiment: 'positive', rank: 3 },
    { query: 'search optimization', platform: 'ChatGPT', sentiment: 'neutral', rank: 8 },
    { query: 'marketing analytics', platform: 'Claude', sentiment: 'positive', rank: 15 }
  ];

  const isSubscribed = (user?.user_metadata as any)?.subscribed || 
    (profile?.subscription_status === 'active' && profile?.subscription_tier === 'pro');

  const scansCount = (user?.user_metadata as any)?.scans_count || 0;

  return (
    <div className="min-h-screen bg-background">
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
                  <Button onClick={handleProfileUpdate} style={{ backgroundColor: '#6B5BFF' }}>
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
                      {isSubscribed ? 'Pro' : 'Free'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Scans Used This Month</span>
                    <Badge variant="outline">
                      {scansCount} / {isSubscribed ? '∞' : '100'}
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

            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>
                    Configure your API keys for enhanced functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DevModeToggle />
                  
                  {/* OpenAI API Key */}
                  <div>
                    <Label htmlFor="openai">OpenAI API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="openai"
                        type={showKeys.openai ? "text" : "password"}
                        value={showKeys.openai ? apiKeys.openai : maskKey(apiKeys.openai)}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                        placeholder="sk-..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility('openai')}
                      >
                        {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Example: sk-proj-abc123...xyz789
                    </p>
                  </div>

                  {/* Perplexity API Key */}
                  <div>
                    <Label htmlFor="perplexity">Perplexity API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="perplexity"
                        type={showKeys.perplexity ? "text" : "password"}
                        value={showKeys.perplexity ? apiKeys.perplexity : maskKey(apiKeys.perplexity)}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, perplexity: e.target.value }))}
                        placeholder="pplx-..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility('perplexity')}
                      >
                        {showKeys.perplexity ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Example: pplx-abc123...xyz789
                    </p>
                  </div>

                  {/* Google Analytics API Key */}
                  <div>
                    <Label htmlFor="google_analytics">Google Analytics API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="google_analytics"
                        type={showKeys.google_analytics ? "text" : "password"}
                        value={showKeys.google_analytics ? apiKeys.google_analytics : maskKey(apiKeys.google_analytics)}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, google_analytics: e.target.value }))}
                        placeholder="AIza..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility('google_analytics')}
                      >
                        {showKeys.google_analytics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Example: AIzaSyC123...xyz789
                    </p>
                  </div>

                  {/* Screaming Frog API Key */}
                  <div>
                    <Label htmlFor="screaming_frog">Screaming Frog API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="screaming_frog"
                        type={showKeys.screaming_frog ? "text" : "password"}
                        value={showKeys.screaming_frog ? apiKeys.screaming_frog : maskKey(apiKeys.screaming_frog)}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, screaming_frog: e.target.value }))}
                        placeholder="sf-..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility('screaming_frog')}
                      >
                        {showKeys.screaming_frog ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Example: sf-abc123...xyz789
                    </p>
                  </div>

                  <ApiKeyValidator apiKeys={apiKeys} />
                  
                  <Button onClick={handleApiKeysUpdate} style={{ backgroundColor: '#6B5BFF' }}>
                    <Save className="w-4 h-4 mr-2" />
                    Save API Keys
                  </Button>
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
                        {isSubscribed ? 'Pro Plan - $49/month' : 'Free Plan'}
                      </p>
                    </div>
                    <Badge variant={isSubscribed ? 'default' : 'secondary'}>
                      {isSubscribed ? 'Active' : 'Free'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Features Included:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {isSubscribed ? 'Unlimited' : 'Up to 100'} scans per month</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Advanced AI analytics</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Competitor analysis</li>
                      <li>• {isSubscribed ? '✓' : '✗'} Priority support</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => toast({ title: "Coming Soon", description: "Billing management will be available soon." })}
                    style={{ backgroundColor: '#6B5BFF' }}
                    className="w-full"
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