import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users, 
  Globe,
  Search,
  Settings,
  LogOut,
  User,
  Sparkles
} from 'lucide-react';
import { AIVisibilityScore } from '@/components/dashboard/AIVisibilityScore';
import { CitationsTracking } from '@/components/dashboard/CitationsTracking';
import { SentimentAnalysis } from '@/components/dashboard/SentimentAnalysis';
import { AIRankings } from '@/components/dashboard/AIRankings';
import { PromptTrends } from '@/components/dashboard/PromptTrends';
import { CompetitorTraffic } from '@/components/dashboard/CompetitorTraffic';
import { TrendingPages } from '@/components/dashboard/TrendingPages';
import { showToast } from '@/lib/toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [scanUrl, setScanUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkUser();
    loadLatestScan();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserEmail(user.email || '');
    setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
  };

  const loadLatestScan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (scans && scans.length > 0) {
      setScanData(scans[0].results);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const runNewScan = async () => {
    if (!scanUrl) {
      showToast.error('Please enter a URL to scan');
      return;
    }

    setIsScanning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call your scan API endpoint using centralized API config
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pulsespark.ai';
      const response = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          url: scanUrl,
          userId: user?.id,
          scanType: 'comprehensive'
        })
      });

      const data = await response.json();
      setScanData(data.results);
      showToast.success('Scan completed successfully!');
      
      // Reload scan data
      await loadLatestScan();
    } catch (error) {
      showToast.error('Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const getUserInitial = () => {
    return userName.charAt(0).toUpperCase();
  };

  const renderContent = () => {
    switch(activeView) {
      case 'citations':
        return <CitationsTracking scanData={scanData} />;
      case 'sentiment':
        return <SentimentAnalysis scanData={scanData} />;
      case 'rankings':
        return <AIRankings scanData={scanData} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AIVisibilityScore scanData={scanData} />
            <SentimentAnalysis scanData={scanData} />
            <CitationsTracking scanData={scanData} />
            <AIRankings scanData={scanData} />
            <PromptTrends scanData={scanData} />
            <CompetitorTraffic scanData={scanData} />
            <TrendingPages scanData={scanData} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-2xl font-bold text-foreground">AI Visibility Dashboard</h1>
            
            {/* URL Input */}
            <div className="flex gap-2 max-w-xl flex-1">
              <Input
                type="url"
                placeholder="Enter domain to analyze (e.g., example.com)"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={runNewScan}
                disabled={isScanning || !scanUrl}
              >
                {isScanning ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Run New Scan
                  </>
                )}
              </Button>
              
              {/* API Test Button - Temporary for testing */}
              <Button
                onClick={async () => {
                  try {
                    const data = await api.testConnection();
                    console.log('API Response:', data);
                    showToast.success(`API Connected! Status: ${data.status}`);
                  } catch (error) {
                    console.error('API Error:', error);
                    showToast.error('API connection failed');
                  }
                }}
                variant="outline"
                className="ml-2"
              >
                Test API Connection
              </Button>
            </div>
          </div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {scanData && (
          <div className="px-6 pb-4 text-sm text-muted-foreground">
            Last scan: {new Date(scanData.created_at || Date.now()).toLocaleDateString()}
          </div>
        )}
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveView('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'overview' 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Brain className="w-5 h-5" />
              AI Visibility
            </button>
            
            <button
              onClick={() => setActiveView('citations')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'citations' 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Citations
            </button>
            
            <button
              onClick={() => setActiveView('sentiment')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'sentiment' 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Sentiment
            </button>
            
            <button
              onClick={() => setActiveView('rankings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'rankings' 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="w-5 h-5" />
              Rankings
            </button>
            
            <button
              onClick={() => navigate('/perplexity-optimization')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted border-t mt-4 pt-4"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">AI Optimization</span>
              <Badge className="ml-auto" variant="secondary">New</Badge>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* AI Optimization Promotion Card */}
          {!scanData && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-6 h-6 text-primary" />
                      <h3 className="text-xl font-semibold">New! Perplexity AI Optimization</h3>
                      <Badge variant="secondary">Beta</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Analyze your website against Perplexity's ranking factors and get actionable recommendations to improve your AI search visibility.
                    </p>
                    <Button 
                      onClick={() => navigate('/perplexity-optimization')}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Try AI Optimization →
                    </Button>
                  </div>
                  <div className="hidden md:block">
                    <Brain className="w-24 h-24 text-primary/20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;