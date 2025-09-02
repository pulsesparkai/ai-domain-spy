import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/ui/code-block';
import { Eye, EyeOff, Key, User, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import DevModeToggle from '@/components/DevModeToggle';

export default function Settings() {
  const { user, profile, updateProfile, updateUserMetadata } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
  });
  const [apiKeys, setApiKeys] = useState({
    openai: user?.user_metadata?.api_keys?.openai || '',
    perplexity: user?.user_metadata?.api_keys?.perplexity || '',
    google_analytics: user?.user_metadata?.api_keys?.google_analytics || '',
    screaming_frog: user?.user_metadata?.api_keys?.screaming_frog || '',
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    perplexity: false,
    google_analytics: false,
    screaming_frog: false,
  });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileData);
  };

  const handleApiKeysUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Store API keys in user_metadata (for development)
      // Production note: migrate to separate encrypted profiles table with RLS policy
      await updateUserMetadata({ api_keys: apiKeys });
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    // Stripe placeholder - coming soon
    toast({
      title: "Coming Soon",
      description: "Billing management will be available soon!",
    });
  };

  const toggleKeyVisibility = (key: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    return key.length > 8 ? `${key.slice(0, 4)}${'•'.repeat(key.length - 8)}${key.slice(-4)}` : key;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    disabled
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed from this page</p>
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Securely store your API keys for enhanced analytics features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApiKeysUpdate} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="perplexity">Perplexity API Key</Label>
                    <div className="relative">
                      <Input
                        id="perplexity"
                        type={showKeys.perplexity ? "text" : "password"}
                        value={apiKeys.perplexity}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, perplexity: e.target.value }))}
                        placeholder="pplx-..."
                        aria-label="Perplexity API Key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility('perplexity')}
                        aria-label="Toggle Perplexity API Key visibility"
                      >
                        {showKeys.perplexity ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <CodeBlock className="text-xs">
                      {`# Example Perplexity API Key format:\npplx-1234567890abcdef1234567890abcdef`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openai">OpenAI API Key</Label>
                    <div className="relative">
                      <Input
                        id="openai"
                        type={showKeys.openai ? "text" : "password"}
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                        placeholder="sk-..."
                        aria-label="OpenAI API Key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility('openai')}
                        aria-label="Toggle OpenAI API Key visibility"
                      >
                        {showKeys.openai ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <CodeBlock className="text-xs">
                      {`# Example OpenAI API Key format:\nsk-1234567890abcdef1234567890abcdef`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_analytics">Google Analytics API Key</Label>
                    <div className="relative">
                      <Input
                        id="google_analytics"
                        type={showKeys.google_analytics ? "text" : "password"}
                        value={apiKeys.google_analytics}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, google_analytics: e.target.value }))}
                        placeholder="AIza..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility('google_analytics')}
                      >
                        {showKeys.google_analytics ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <CodeBlock className="text-xs">
                      {`# Example Google Analytics API Key format:\nAIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="screaming_frog">Screaming Frog API Key</Label>
                    <div className="relative">
                      <Input
                        id="screaming_frog"
                        type={showKeys.screaming_frog ? "text" : "password"}
                        value={apiKeys.screaming_frog}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, screaming_frog: e.target.value }))}
                        placeholder="sf_..."
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility('screaming_frog')}
                      >
                        {showKeys.screaming_frog ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <CodeBlock className="text-xs">
                      {`# Example Screaming Frog API format:\nsf_1234567890abcdef1234567890abcdef`}
                    </CodeBlock>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <DevModeToggle />
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save API Keys'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Current Plan</h3>
                  <p className="text-sm text-gray-600">
                    {profile?.subscription_tier === 'pro' ? 'Pro Plan - $49/month' : 
                     profile?.subscription_status === 'trial' ? 'Free Trial' : 'Free Plan'}
                  </p>
                </div>
                <Button onClick={handleManageBilling} variant="outline">
                  Manage Billing
                </Button>
              </div>
              
              {profile?.subscription_status === 'trial' && profile?.trial_ends_at && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800">Trial Period</h4>
                  <p className="text-sm text-yellow-700">
                    Your trial ends on {new Date(profile.trial_ends_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}