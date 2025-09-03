import { useEffect, useState, Suspense, lazy, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { OnboardingTour } from "@/components/OnboardingTour";
import { SampleDataScript } from "@/components/SampleDataScript";
import DashboardErrorBoundary from "@/components/DashboardErrorBoundary";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { LazyComponentWrapper } from "@/components/dashboard/LazyComponentWrapper";
import 'react-tooltip/dist/react-tooltip.css';

// Lazy load dashboard components for code splitting
const AIVisibilityScore = lazy(() => import('@/components/dashboard/AIVisibilityScore').then(module => ({ default: module.AIVisibilityScore })));
const CitationsTracking = lazy(() => import('@/components/dashboard/CitationsTracking').then(module => ({ default: module.CitationsTracking })));
const SentimentAnalysis = lazy(() => import('@/components/dashboard/SentimentAnalysis').then(module => ({ default: module.SentimentAnalysis })));
const AIRankings = lazy(() => import('@/components/dashboard/AIRankings').then(module => ({ default: module.AIRankings })));
const PromptTrends = lazy(() => import('@/components/dashboard/PromptTrends').then(module => ({ default: module.PromptTrends })));
const CompetitorTraffic = lazy(() => import('@/components/dashboard/CompetitorTraffic').then(module => ({ default: module.CompetitorTraffic })));
const TrendingPages = lazy(() => import('@/components/dashboard/TrendingPages').then(module => ({ default: module.TrendingPages })));

// Memoized Dashboard Header
const DashboardHeader = memo(({ latestScan, onNavigateToScan }: { 
  latestScan: any; 
  onNavigateToScan: () => void; 
}) => (
  <div className="mb-6 flex items-center justify-between animate-fade-in">
    <div>
      <h1 className="text-3xl font-bold text-foreground">AI Visibility Dashboard</h1>
      <p className="text-muted-foreground">
        {latestScan ? 
          `Last scan: ${new Date(latestScan.created_at).toLocaleDateString()}` :
          'Run your first scan to see data here'
        }
      </p>
    </div>
    <div className="flex space-x-2">
      <Button 
        onClick={onNavigateToScan}
        variant="default"
        className="hover-scale"
      >
        Run New Scan
      </Button>
      <SidebarTrigger />
    </div>
  </div>
));

DashboardHeader.displayName = 'DashboardHeader';

// Memoized Navigation Sidebar
const DashboardSidebar = memo(() => (
  <Sidebar className="w-64 border-r border-border bg-sidebar animate-slide-in-right">
    <SidebarContent className="p-4">
      <div className="space-y-4">
        <div className="text-sidebar-foreground font-semibold">Dashboard</div>
        <nav className="space-y-2">
          <a href="#visibility" className="block px-3 py-2 rounded-md bg-primary text-primary-foreground story-link">
            AI Visibility
          </a>
          <a href="#citations" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent story-link">
            Citations
          </a>
          <a href="#sentiment" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent story-link">
            Sentiment
          </a>
          <a href="#rankings" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent story-link">
            Rankings
          </a>
        </nav>
      </div>
    </SidebarContent>
  </Sidebar>
));

DashboardSidebar.displayName = 'DashboardSidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [startTour, setStartTour] = useState(false);
  const [latestScan, setLatestScan] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(true);

  const fetchLatestScan = async () => {
    try {
      if (!user) return;
      
      setScanLoading(true);
      const { data } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setLatestScan(data[0]);
      }
    } catch (error) {
      console.error('Error fetching scan data:', error);
      throw error; // Let error boundary handle it
    } finally {
      setScanLoading(false);
    }
  };

  const handleNavigateToScan = () => {
    navigate('/scan');
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      analytics.page('Dashboard', { userId: user.id });
      setStartTour(true);
      fetchLatestScan();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <DashboardSidebar />

          <main className="flex-1 overflow-auto p-6">
            <DashboardHeader 
              latestScan={latestScan} 
              onNavigateToScan={handleNavigateToScan}
            />

            {/* Development Tools - Only show in dev mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-8">
                <SampleDataScript />
              </div>
            )}

            <PaywallOverlay>
              <DashboardErrorBoundary onRetry={fetchLatestScan}>
                {scanLoading ? (
                  <DashboardSkeleton />
                ) : (
                  <div className="scan-results grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Primary/Above-the-fold content - Load immediately */}
                    <div className="lg:col-span-2" id="visibility">
                      <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                        <AIVisibilityScore scanData={latestScan?.results} />
                      </Suspense>
                    </div>

                    <div id="sentiment">
                      <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                        <SentimentAnalysis scanData={latestScan?.results} />
                      </Suspense>
                    </div>

                    {/* Below-the-fold content - Lazy load with intersection observer */}
                    <div id="citations">
                      <LazyComponentWrapper>
                        <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                          <CitationsTracking scanData={latestScan?.results} />
                        </Suspense>
                      </LazyComponentWrapper>
                    </div>

                    <div id="rankings">
                      <LazyComponentWrapper>
                        <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                          <AIRankings scanData={latestScan?.results} />
                        </Suspense>
                      </LazyComponentWrapper>
                    </div>

                    <LazyComponentWrapper>
                      <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                        <PromptTrends scanData={latestScan?.results} />
                      </Suspense>
                    </LazyComponentWrapper>

                    <LazyComponentWrapper>
                      <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                        <CompetitorTraffic scanData={latestScan?.results} />
                      </Suspense>
                    </LazyComponentWrapper>

                    <div className="lg:col-span-2">
                      <LazyComponentWrapper>
                        <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                          <TrendingPages scanData={latestScan?.results} />
                        </Suspense>
                      </LazyComponentWrapper>
                    </div>
                  </div>
                )}
              </DashboardErrorBoundary>
            </PaywallOverlay>
          </main>
        </div>
      </SidebarProvider>
      
      <OnboardingTour 
        startTour={startTour} 
        onComplete={() => setStartTour(false)}
      />
    </div>
  );
};

export default Dashboard;