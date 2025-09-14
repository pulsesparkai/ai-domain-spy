import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowUpRight, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  const [activeView, setActiveView] = useState('visibility');
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        return <CitationsList />;
      case 'sentiment':
        return <SentimentAnalyzer />;
      case 'rankings':
        return <RankingsTable />;
      case 'reports':
        return <ReportsTable />;
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

  return (
    <DashboardLayout activeView={activeView} onViewChange={setActiveView}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {scanData ? 'Latest scan results' : 'Run a scan to see your data'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/scan')}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              New Scan
            </Button>
            {scanData && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {renderView()}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;