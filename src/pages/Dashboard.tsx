import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import DashboardNavigation from '@/components/DashboardNavigation';
import { Sidebar } from '@/components/Sidebar';
import WorkflowCanvas from '@/components/dashboard/WorkflowCanvas';
import { NetworkMap } from '@/components/NetworkMap';
import { DiscoverAnalysis } from '@/components/DiscoverAnalysis';
import { EnhancedDomainAnalysis } from '@/components/EnhancedDomainAnalysis';
import TrendingSearchesTable from '@/components/dashboard/TrendingSearchesTable';
import CitationsList from '@/components/dashboard/CitationsList';
import SentimentAnalyzer from '@/components/dashboard/SentimentAnalyzer';
import RankingsTable from '@/components/dashboard/RankingsTable';
import { ArrowUp } from 'lucide-react';
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
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [scanData, setScanData] = useState<ScanData>({
    readiness: 0,
    depth: 0,
    authority: 0,
    citations: 0,
    platforms: { reddit: 0, youtube: 0, linkedin: 0, quora: 0, news: 0 },
  });

  useEffect(() => {
    // Load user data and recent scans
    if (user) {
      // Simulate loading scan data
      setScanData({
        readiness: 75,
        depth: 65,
        authority: 80,
        citations: 24,
        platforms: { reddit: 8, youtube: 5, linkedin: 6, quora: 3, news: 2 },
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
        <div className="flex">
          <Sidebar activeView="dashboard" onViewChange={() => {}} />
          <div className="flex-1">
            <DashboardNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="flex-1 p-6">
              {!user ? (
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
              ) : (
                <div className="max-w-7xl mx-auto">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsContent value="overview" className="space-y-6">
                      {/* AI Visibility Overview */}
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

                    <TabsContent value="workflow">
                      <WorkflowCanvas />
                    </TabsContent>

                    <TabsContent value="network-map">
                      <NetworkMap />
                    </TabsContent>

                    <TabsContent value="discover">
                      <DiscoverAnalysis />
                    </TabsContent>

                    <TabsContent value="domain">
                      <EnhancedDomainAnalysis />
                    </TabsContent>

                    <TabsContent value="trends">
                      <TrendingSearchesTable />
                    </TabsContent>

                    <TabsContent value="citations">
                      <CitationsList />
                    </TabsContent>

                    <TabsContent value="sentiment">
                      <SentimentAnalyzer />
                    </TabsContent>

                    <TabsContent value="rankings">
                      <RankingsTable />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;