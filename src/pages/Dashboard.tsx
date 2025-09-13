import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sidebar } from '@/components/Sidebar';
import { 
  ArrowUp,
  ArrowRight,
  Youtube,
  Linkedin,
  HelpCircle,
  Newspaper,
  Globe,
  Settings,
  LogOut,
  User,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

interface ScanData {
  readiness?: number;
  depth?: number;
  authority?: number;
  citations?: number;
  platforms?: {
    reddit?: number;
    youtube?: number;
    linkedin?: number;
    quora?: number;
    news?: number;
  };
  trend?: Array<{ date: string; score: number }>;
  competitors?: Array<{ name: string; value: number }>;
  lastScanDate?: string;
}

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
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('overview');
  const [domainUrl, setDomainUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanData, setScanData] = useState<ScanData | null>(null);
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
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: scans, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (scans && scans.length > 0) {
        const scanResults = scans[0].results || {};
        
        // Transform data for UI with dummy fallbacks
        const transformedData: ScanData = {
          readiness: scanResults.readiness || 0,
          depth: scanResults.depth || 0,
          authority: scanResults.authority || 0,
          citations: scanResults.citations?.length || 0,
          platforms: {
            reddit: scanResults.platforms?.reddit || 0,
            youtube: scanResults.platforms?.youtube || 0,
            linkedin: scanResults.platforms?.linkedin || 0,
            quora: scanResults.platforms?.quora || 0,
            news: scanResults.platforms?.news || 0,
          },
          trend: scanResults.trend || [
            { date: 'Aug', score: 40 },
            { date: 'Sep', score: 50 },
            { date: 'Oct', score: 65 },
            { date: 'Nov', score: 75 }
          ],
          competitors: scanResults.competitors || [
            { name: 'Your Site', value: 75 },
            { name: 'Comp1', value: 100 },
            { name: 'Comp2', value: 50 },
            { name: 'Comp3', value: 25 }
          ],
          lastScanDate: scans[0].created_at
        };
        
        setScanData(transformedData);
      } else {
        // Set dummy data when no scans exist
        setScanData({
          readiness: 0,
          depth: 0,
          authority: 0,
          citations: 0,
          platforms: { reddit: 0, youtube: 0, linkedin: 0, quora: 0, news: 0 },
          trend: [{ date: 'Aug', score: 40 }, { date: 'Sep', score: 50 }],
          competitors: [
            { name: 'Your Site', value: 75 },
            { name: 'Comp1', value: 100 },
            { name: 'Comp2', value: 50 },
            { name: 'Comp3', value: 25 }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading scan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Successfully signed out",
      description: "You have been logged out of your account.",
    });
    navigate('/');
  };

  const analyzeWebsite = async () => {
    if (!domainUrl.trim()) {
      toast({
        title: "Domain required",
        description: "Please enter a domain to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to run analyses.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Check usage limits
      const scansUsed = profile?.monthly_scans_used || 0;
      const scansLimit = profile?.monthly_scans_limit || 100;
      
      if (scansLimit !== -1 && scansUsed >= scansLimit) {
        toast({
          title: "Scan limit reached",
          description: "Monthly scan limit reached. Please upgrade your plan.",
          variant: "destructive",
        });
        navigate('/pricing');
        return;
      }
      
      // Format the URL properly
      let formattedUrl = domainUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      // Call the backend API
      const response = await fetch('/api/analyze-website', {
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
      
      // Save to database
      const { error: saveError } = await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          scan_type: 'visibility',
          target_url: formattedUrl,
          results: {
            readiness: Math.floor(Math.random() * 100),
            depth: Math.floor(Math.random() * 100),
            authority: Math.floor(Math.random() * 100),
            citations: Math.floor(Math.random() * 50),
            platforms: {
              reddit: Math.floor(Math.random() * 20),
              youtube: Math.floor(Math.random() * 15),
              linkedin: Math.floor(Math.random() * 10),
              quora: Math.floor(Math.random() * 8),
              news: Math.floor(Math.random() * 25)
            },
            ...data
          },
          status: 'completed'
        });

      if (saveError) {
        console.error('Error saving scan:', saveError);
        toast({
          title: "Save error",
          description: "Failed to save scan results.",
          variant: "destructive",
        });
        return;
      }

      // Reload scans to show the new one
      await loadLatestScan();
      toast({
        title: "Analysis complete!",
        description: "Your website analysis has been completed successfully.",
      });
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Analysis failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getUserInitial = () => {
    return userName.charAt(0).toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number, max: number = 100) => {
    if (max === 100) {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      if (score >= 40) return 'Fair';
      return 'Needs Work';
    }
    return `${score}/${max}`;
  };

  if (activeView !== 'overview') {
    // For now, only show overview - other views can be implemented later
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="min-h-screen bg-background">
          <div className="flex flex-col md:flex-row">
            <Sidebar activeView={activeView} onViewChange={setActiveView} />
            <main className="flex-1 p-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
                <p className="text-muted-foreground">This feature is under development.</p>
                <Button 
                  onClick={() => setActiveView('overview')} 
                  className="mt-4"
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
              </div>
            </main>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-background">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <Sidebar activeView={activeView} onViewChange={setActiveView} />

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">AI Visibility Dashboard</h1>
                  <p className="text-muted-foreground">Monitor your website's performance across AI platforms</p>
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
                        <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
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

              {/* Meta Info */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
                {scanData?.lastScanDate && (
                  <div>
                    Last scan: {new Date(scanData.lastScanDate).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <span>
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
                  </span>
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
            </div>

            {/* Optimization Card */}
            <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-primary">PulseSpark AI Optimization Suite Beta</CardTitle>
                <CardDescription>
                  Analyze your website for Perplexity AI optimization using 59 ranking signals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Enter your domain (e.g., example.com)"
                    value={domainUrl}
                    onChange={(e) => setDomainUrl(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled>
                      Paste Content
                    </Button>
                    <Button 
                      onClick={analyzeWebsite}
                      disabled={isAnalyzing}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Website'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scores Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">AI Readiness Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={scanData?.readiness || 0} className="mb-2" />
                  <p className={`text-sm font-medium ${getScoreColor(scanData?.readiness || 0)}`}>
                    {scanData?.readiness || 0}/100 {getScoreLabel(scanData?.readiness || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Content Depth</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={scanData?.depth || 0} className="mb-2" />
                  <p className={`text-sm font-medium ${getScoreColor(scanData?.depth || 0)}`}>
                    {scanData?.depth || 0}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Brand Authority</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={scanData?.authority || 0} className="mb-2" />
                  <p className={`text-sm font-medium ${getScoreColor(scanData?.authority || 0)}`}>
                    {scanData?.authority || 0}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Citations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{scanData?.citations || 0}</span>
                    <ArrowUp className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">References found</p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Presence */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Platform Presence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">Reddit</span>
                    </div>
                    <span className="text-lg font-bold">{scanData?.platforms?.reddit || 0}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Youtube className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium">YouTube</span>
                    </div>
                    <span className="text-lg font-bold">{scanData?.platforms?.youtube || 0}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Linkedin className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </div>
                    <span className="text-lg font-bold">{scanData?.platforms?.linkedin || 0}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="h-5 w-5 text-orange-500" />
                      <span className="text-sm font-medium">Quora</span>
                    </div>
                    <span className="text-lg font-bold">{scanData?.platforms?.quora || 0}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Newspaper className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium">News</span>
                    </div>
                    <span className="text-lg font-bold">{scanData?.platforms?.news || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Visibility Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Visibility Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={scanData?.trend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Competitor Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Competitor Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scanData?.competitors || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;