import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkflowCanvas from '@/components/dashboard/WorkflowCanvas';
import { NetworkMap } from '@/components/NetworkMap';
import { DiscoverAnalysis } from '@/components/DiscoverAnalysis';
import { EnhancedDomainAnalysis } from '@/components/EnhancedDomainAnalysis';
import TrendingSearchesTable from '@/components/dashboard/TrendingSearchesTable';
import CitationsList from '@/components/dashboard/CitationsList';
import SentimentAnalyzer from '@/components/dashboard/SentimentAnalyzer';
import RankingsTable from '@/components/dashboard/RankingsTable';
import ReportsTable from '@/components/dashboard/ReportsTable';
import { 
  ArrowUp, 
  Eye, 
  Workflow, 
  Network, 
  Search, 
  BarChart3, 
  TrendingUp, 
  Quote, 
  Heart, 
  Target,
  FileText 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
  graph?: any;
}

const navigationItems = [
  { id: 'visibility', label: 'AI Visibility', icon: Eye },
  { id: 'workflow', label: 'Workflow', icon: Workflow },
  { id: 'network-map', label: 'Network Map', icon: Network },
  { id: 'discover', label: 'Discover Analysis', icon: Search },
  { id: 'domain', label: 'Enhanced Domain Analysis', icon: BarChart3 },
  { id: 'trends', label: 'Trending Searches', icon: TrendingUp },
  { id: 'citations', label: 'Citations', icon: Quote },
  { id: 'sentiment', label: 'Sentiment', icon: Heart },
  { id: 'rankings', label: 'Rankings', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('visibility');
  const [scanData, setScanData] = useState<ScanData>({
    readiness: 0,
    depth: 0,
    authority: 0,
    citations: 0,
    platforms: { reddit: 0, youtube: 0, linkedin: 0, quora: 0, news: 0 },
    graph: null,
  });

  useEffect(() => {
    // Load user data and recent scans
    if (user) {
      // Simulate loading scan data with graph data
      setScanData({
        readiness: 75,
        depth: 65,
        authority: 80,
        citations: 24,
        platforms: { reddit: 8, youtube: 5, linkedin: 6, quora: 3, news: 2 },
        graph: {
          nodes: [
            { id: 'main-domain', label: 'Main Domain', type: 'domain', authority: 80, perplexityImpact: 75 },
            { id: 'page-1', label: 'Homepage', type: 'page', authority: 70, perplexityImpact: 85 },
            { id: 'page-2', label: 'About Page', type: 'page', authority: 60, perplexityImpact: 45 },
            { id: 'citation-1', label: 'Wikipedia Reference', type: 'citation', authority: 95, perplexityImpact: 90 },
            { id: 'authority-1', label: 'Google Scholar', type: 'authority', authority: 98, perplexityImpact: 95 },
          ],
          edges: [
            { id: 'e1', source: 'main-domain', target: 'page-1', type: 'link', strength: 1.0 },
            { id: 'e2', source: 'main-domain', target: 'page-2', type: 'link', strength: 0.8 },
            { id: 'e3', source: 'page-1', target: 'citation-1', type: 'citation', strength: 0.9 },
            { id: 'e4', source: 'citation-1', target: 'authority-1', type: 'backlink', strength: 0.95 },
          ]
        }
      });
    }
  }, [user]);

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Dashboard Error</CardTitle>
              <CardDescription>
                Something went wrong loading the dashboard. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        {!user ? (
          <div className="flex items-center justify-center min-h-screen">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Please sign in to access your AI visibility dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/auth')} className="w-full">
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex w-full">
            {/* Side Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex w-full">
              <div className="min-w-64 lg:min-w-72 border-r border-border bg-card/50 hidden md:block">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
                  <TabsList className="flex flex-col h-auto w-full space-y-1 bg-transparent p-0">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <TabsTrigger
                          key={item.id}
                          value={item.id}
                          className="w-full justify-start gap-3 p-3 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden lg:inline">{item.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden w-full">
                <div className="border-b border-border bg-card p-4">
                  <TabsList className="flex overflow-x-auto space-x-1 bg-transparent p-0 w-max">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <TabsTrigger
                          key={item.id}
                          value={item.id}
                          className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{item.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <main className="p-6">
                  <div className="max-w-7xl mx-auto">
                    {/* AI Visibility Overview */}
                    <TabsContent value="visibility" className="space-y-6 mt-0">
                      <Card>
                        <CardHeader>
                          <CardTitle>AI Visibility Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">AI Readiness Score</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Progress value={scanData?.readiness || 0} className="mb-2" />
                                <p className="text-sm font-medium">{scanData?.readiness || 0}/100</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Content Depth</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Progress value={scanData?.depth || 0} className="mb-2" />
                                <p className="text-sm font-medium">{scanData?.depth || 0}%</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Brand Authority</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Progress value={scanData?.authority || 0} className="mb-2" />
                                <p className="text-sm font-medium">{scanData?.authority || 0}%</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Total Citations</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold">{scanData?.citations || 0}</span>
                                  <ArrowUp className="h-4 w-4 text-green-600" />
                                </div>
                                <p className="text-sm text-muted-foreground">References found</p>
                              </CardContent>
                            </Card>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Workflow Canvas */}
                    <TabsContent value="workflow" className="mt-0">
                      <WorkflowCanvas />
                    </TabsContent>

                    {/* Network Map */}
                    <TabsContent value="network-map" className="mt-0">
                      <NetworkMap graphData={scanData?.graph} />
                    </TabsContent>

                    {/* Discover Analysis */}
                    <TabsContent value="discover" className="mt-0">
                      <DiscoverAnalysis />
                    </TabsContent>

                    {/* Enhanced Domain Analysis */}
                    <TabsContent value="domain" className="mt-0">
                      <EnhancedDomainAnalysis />
                    </TabsContent>

                    {/* Trending Searches */}
                    <TabsContent value="trends" className="mt-0">
                      <TrendingSearchesTable />
                    </TabsContent>

                    {/* Citations */}
                    <TabsContent value="citations" className="mt-0">
                      <CitationsList />
                    </TabsContent>

                    {/* Sentiment Analysis */}
                    <TabsContent value="sentiment" className="mt-0">
                      <SentimentAnalyzer />
                    </TabsContent>

                    {/* Rankings */}
                    <TabsContent value="rankings" className="mt-0">
                      <RankingsTable />
                    </TabsContent>

                    {/* Reports */}
                    <TabsContent value="reports" className="mt-0">
                      <ReportsTable />
                    </TabsContent>
                  </div>
                </main>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;