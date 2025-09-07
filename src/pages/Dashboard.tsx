import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorBoundary as CustomErrorBoundary } from '@/components/ErrorBoundary';
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
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { LoadingCard } from '@/components/LoadingCard';
import { VisibilityChart } from '@/components/charts/VisibilityChart';
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis';
import { PlatformDistribution } from '@/components/charts/PlatformDistribution';
import { KeywordRankings } from '@/components/KeywordRankings';
import { AIVisibilityScore } from '@/components/dashboard/AIVisibilityScore';
import { CitationsTracking } from '@/components/dashboard/CitationsTracking';
import { SentimentAnalysis } from '@/components/dashboard/SentimentAnalysis';
import { AIRankings } from '@/components/dashboard/AIRankings';
import { PromptTrends } from '@/components/dashboard/PromptTrends';
import { CompetitorTraffic } from '@/components/dashboard/CompetitorTraffic';
import { TrendingPages } from '@/components/dashboard/TrendingPages';
import PerplexityOptimizationCard from '@/components/PerplexityOptimizationCard';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
          <pre className="text-sm bg-muted p-4 rounded mb-4 overflow-auto">{error.message}</pre>
          <Button onClick={resetErrorBoundary}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [scanUrl, setScanUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

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
    showToast.success('Successfully signed out');
    navigate('/');
  };

  const runNewScan = async () => {
    if (!scanUrl) {
      showToast.error('Please enter a URL to scan');
      return;
    }

    setIsScanning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast.error('Please sign in to run scans');
        navigate('/auth');
        return;
      }

      // Check usage limits
      const scansUsed = profile?.monthly_scans_used || 0;
      const scansLimit = profile?.monthly_scans_limit || 100;
      
      if (scansLimit !== -1 && scansUsed >= scansLimit) {
        showToast.error('Monthly scan limit reached. Please upgrade your plan.');
        navigate('/pricing');
        return;
      }
      
      // Format the URL properly
      let formattedUrl = scanUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = formattedUrl;  // Don't add protocol, let backend handle it
      }
      
      // Call the backend
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pulsespark.ai';
      const response = await fetch(`${API_BASE_URL}/api/analyze-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: formattedUrl,
          userId: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Save to database with proper structure
      const { error: saveError } = await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          scan_type: 'visibility',
          target_url: formattedUrl,
          results: {
            visibility_score: data.visibilityScore || data.visibility_score || 0,
            citations: [],
            sentiment: { positive: 0, neutral: 100, negative: 0 },
            rankings: [],
            prompt_trends: { gained: [], lost: [], improved: [] },
            competitor_traffic: [],
            trending_pages: [],
            ...data  // Include any additional data from backend
          },
          status: 'completed'
        });

      if (saveError) {
        console.error('Error saving scan:', saveError);
        showToast.error('Failed to save scan results');
        return;
      }

      // Reload scans to show the new one
      await loadLatestScan();
      showToast.success('Scan completed successfully!');
      
    } catch (error: any) {
      console.error('Scan error:', error);
      showToast.error(error.message || 'Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData({
      ...data,
      timestamp: new Date().toISOString()
    });
    // Extract domain from the analysis for other components
    const urlInput = data.url || '';
    setScanUrl(urlInput);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Perplexity Optimization Card - Full Width */}
            <div className="lg:col-span-2 xl:col-span-3">
              <CustomErrorBoundary>
                <PerplexityOptimizationCard onAnalysisComplete={handleAnalysisComplete} />
              </CustomErrorBoundary>
            </div>
            
            {/* Show charts only after analysis */}
            {analysisData && (
              <>
                {/* Visibility Trend Chart */}
                <div className="lg:col-span-1">
                  <VisibilityChart data={analysisData} />
                </div>
                
                {/* Competitor Analysis */}
                <div className="lg:col-span-1">
                  <CompetitorAnalysis 
                    domain={analysisData.domain || scanUrl} 
                    score={analysisData.readinessScore} 
                  />
                </div>
                
                {/* Platform Distribution */}
                <div className="lg:col-span-1">
                  <PlatformDistribution platformData={analysisData.platformPresence} />
                </div>
                
                {/* Keyword Rankings */}
                <div className="lg:col-span-2">
                  <KeywordRankings />
                </div>
                
                {/* AI Visibility Score using analysis data */}
                <div className="lg:col-span-1">
                  <AIVisibilityScore scanData={{
                    aggregates: {
                      visibilityScore: analysisData.readinessScore
                    }
                  }} />
                </div>
              </>
            )}
            
            {/* Show placeholder when no data */}
            {!analysisData && (
              <div className="lg:col-span-2 xl:col-span-3 text-center py-12">
                <p className="text-muted-foreground">Enter a domain above to see detailed analytics</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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

        <div className="px-6 pb-4 flex items-center justify-between">
          {(scanData || analysisData) && (
            <div className="text-sm text-muted-foreground">
              Last scan: {new Date(analysisData?.timestamp || scanData?.created_at || Date.now()).toLocaleDateString()}
            </div>
          )}
          
          {/* Usage Tracking */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Scans remaining this month: 
              <span className={`ml-1 font-medium ${
                (profile?.monthly_scans_limit || 100) - (profile?.monthly_scans_used || 0) <= 5 
                  ? 'text-destructive' 
                  : 'text-foreground'
              }`}>
                {profile?.monthly_scans_limit === -1 
                  ? '∞' 
                  : Math.max(0, (profile?.monthly_scans_limit || 100) - (profile?.monthly_scans_used || 0))
                }
              </span>
            </div>
            {profile?.monthly_scans_limit !== -1 && 
             (profile?.monthly_scans_used || 0) >= (profile?.monthly_scans_limit || 100) * 0.8 && (
              <Button 
                onClick={() => navigate('/pricing')} 
                size="sm" 
                variant="outline"
                className="text-primary border-primary hover:bg-primary/10"
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>
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
            
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Content */}
          {renderContent()}
        </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;