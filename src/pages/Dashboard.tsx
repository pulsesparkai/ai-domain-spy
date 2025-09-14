import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from '@/components/DashboardSidebar';
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
  ArrowUp
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
    // Load user data and recent scans with pagination
    if (user) {
      const loadDashboardData = async () => {
        try {
          console.log('Query executed: dashboard-scans', { user_id: user.id, limit: 10, offset: 0 });
          
          // Load recent scans with LIMIT for pagination
          const { data: recentScans, error: scansError } = await supabase
            .from('scans')
            .select('id, scan_type, target_url, status, created_at, results')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10) // Pagination limit
            .range(0, 9); // Offset 0, limit 10

          if (scansError) {
            console.error('Dashboard scan query error:', scansError);
          } else {
            console.log('Query completed: dashboard-scans', { count: recentScans?.length || 0 });
          }

          // Simulate loading scan data with graph data - replace with actual data processing
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
        } catch (error) {
          console.error('Dashboard data loading error:', error);
        }
      };

      loadDashboardData();
    }
  }, [user]);

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar */}
        <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              
              {/* AI Visibility Tab */}
              <TabsContent value="visibility" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">AI Readiness</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{scanData.readiness}%</div>
                      <Progress value={scanData.readiness} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Content Depth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{scanData.depth}%</div>
                      <Progress value={scanData.depth} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Authority Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{scanData.authority}%</div>
                      <Progress value={scanData.authority} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Citations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{scanData.citations}</div>
                      <p className="text-xs text-muted-foreground">Total backlinks</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(scanData.platforms || {}).map(([platform, count]) => (
                          <div key={platform} className="flex justify-between items-center">
                            <span className="capitalize">{platform}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" onClick={() => navigate('/scan')}>
                        <ArrowUp className="mr-2 h-4 w-4" />
                        Run New Scan
                      </Button>
                      <Button variant="outline" className="w-full">
                        Export Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Workflow Tab */}
              <TabsContent value="workflow">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Workflow Canvas</CardTitle>
                    <CardDescription>
                      Design and automate your SEO workflow with drag-and-drop components
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 border rounded-lg">
                      <WorkflowCanvas />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Network Map Tab */}
              <TabsContent value="network-map">
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Network Map</CardTitle>
                    <CardDescription>
                      Explore your website's link structure and authority distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <NetworkMap graphData={scanData.graph} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Discover Analysis Tab */}
              <TabsContent value="discover">
                <DiscoverAnalysis />
              </TabsContent>

              {/* Domain Analysis Tab */}
              <TabsContent value="domain">
                <EnhancedDomainAnalysis />
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends">
                <TrendingSearchesTable />
              </TabsContent>

              {/* Citations Tab */}
              <TabsContent value="citations">
                <CitationsList />
              </TabsContent>

              {/* Sentiment Tab */}
              <TabsContent value="sentiment">
                <SentimentAnalyzer />
              </TabsContent>

              {/* Rankings Tab */}
              <TabsContent value="rankings">
                <RankingsTable />
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports">
                <ReportsTable />
              </TabsContent>

            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;