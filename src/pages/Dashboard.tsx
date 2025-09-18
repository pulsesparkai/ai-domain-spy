import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowUpRight, Download, Star, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ScanHistoryTable } from '@/components/ScanHistoryTable';
import { useScanHistoryStore } from '@/store/scanHistoryStore';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { BrandOnboarding } from '@/components/BrandOnboarding';

// Import dashboard components
import { VisibilityScore as VisibilityScoreComponent } from '@/components/dashboard/VisibilityScore';
import { DomainAnalysis } from '@/components/dashboard/DomainAnalysis';
import TrendingSearchesTable from '@/components/dashboard/TrendingSearchesTable';
import CitationsList from '@/components/dashboard/CitationsList';
import SentimentAnalyzer from '@/components/dashboard/SentimentAnalyzer';
import RankingsTable from '@/components/dashboard/RankingsTable';
import ReportsTable from '@/components/dashboard/ReportsTable';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadScans } = useScanHistoryStore();
  const { brandProfile, loading: brandLoading } = useBrandProfile();
  const [activeView, setActiveView] = useState('visibility');
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBrandOnboarding, setShowBrandOnboarding] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchLatestScan();
  }, []);

  const fetchLatestScan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: scans } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (scans && scans[0]) {
        setScanData(scans[0].results);
      }
    } catch (error) {
      console.error('Error fetching scan data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch scan data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sync active view with URL search param
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && view !== activeView) {
      setActiveView(view);
    }
  }, [searchParams, activeView]);

  // Keep URL updated when view changes
  useEffect(() => {
    const current = searchParams.get('view');
    if (activeView && current !== activeView) {
      const params = new URLSearchParams(searchParams);
      params.set('view', activeView);
      setSearchParams(params);
    }
  }, [activeView, searchParams, setSearchParams]);

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!scanData) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No scan data available</h3>
            <p className="text-gray-500 mb-4">Run your first scan to see analytics and insights here.</p>
            <Button onClick={() => navigate('/scan')}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Run Your First Scan
            </Button>
          </CardContent>
        </Card>
      );
    }

    switch (activeView) {
      case 'visibility':
        return <VisibilityScoreComponent data={scanData} />;
      case 'domain':
        return <DomainAnalysis data={scanData} />;
      case 'trends':
        return <TrendingSearchesTable />;
      case 'citations':
        return <CitationsList citations={scanData?.citations || []} />;
      case 'sentiment':
        return <SentimentAnalyzer />;
      case 'rankings':
        return <RankingsTable />;
      case 'reports':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Scan History & Reports</CardTitle>
              <CardDescription>Comprehensive history of all your AI visibility scans</CardDescription>
            </CardHeader>
            <CardContent>
              <ScanHistoryTable showFilters={true} />
            </CardContent>
          </Card>
        );
      default:
        return <VisibilityScoreComponent data={scanData} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <CardContent>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p>Please sign in to access the dashboard.</p>
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showBrandOnboarding) {
    return (
      <div className="p-6">
        <BrandOnboarding 
          onComplete={() => {
            setShowBrandOnboarding(false);
            toast({
              title: "🎉 Brand Profile Complete!",
              description: "Great! All scans will now use your brand profile automatically",
            });
          }}
          onSkip={() => setShowBrandOnboarding(false)}
          onClose={() => setShowBrandOnboarding(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Visibility Dashboard</h1>
          <p className="text-muted-foreground">
            {scanData ? 'Latest scan results' : 'Run a scan to see your data'}
          </p>
        </div>
        <div className="flex gap-2">
          {scanData && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
          <Button onClick={() => navigate('/scan')} variant="default">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            New Scan
          </Button>
        </div>
      </div>

      {/* Brand Profile Setup CTA */}
      {!brandLoading && !brandProfile?.brand_name && (
        <Card className="border-primary bg-primary/5 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Complete Your Brand Profile
                    <Star className="h-4 w-4 text-amber-500" />
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Set up your brand information once and we'll automatically use it for all scans.
                    This enables smart query generation, competitor analysis, and location-based insights.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowBrandOnboarding(true)}
                className="bg-primary hover:bg-primary/90"
              >
                Set Up Brand →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {renderView()}
    </div>
  );
};

export default Dashboard;
