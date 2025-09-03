import { useEffect, useState, Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { OnboardingTour } from "@/components/OnboardingTour";
import { SampleDataScript } from "@/components/SampleDataScript";
import DashboardErrorBoundary from "@/components/DashboardErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { LazyComponentWrapper } from "@/components/dashboard/LazyComponentWrapper";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardView } from "@/components/compound/DashboardView";
import 'react-tooltip/dist/react-tooltip.css';

// Lazy load dashboard components for code splitting
const AIVisibilityScore = lazy(() => import('@/components/dashboard/AIVisibilityScore').then(module => ({ default: module.AIVisibilityScore })));
const CitationsTracking = lazy(() => import('@/components/dashboard/CitationsTracking').then(module => ({ default: module.CitationsTracking })));
const SentimentAnalysis = lazy(() => import('@/components/dashboard/SentimentAnalysis').then(module => ({ default: module.SentimentAnalysis })));
const AIRankings = lazy(() => import('@/components/dashboard/AIRankings').then(module => ({ default: module.AIRankings })));
const PromptTrends = lazy(() => import('@/components/dashboard/PromptTrends').then(module => ({ default: module.PromptTrends })));
const CompetitorTraffic = lazy(() => import('@/components/dashboard/CompetitorTraffic').then(module => ({ default: module.CompetitorTraffic })));
const TrendingPages = lazy(() => import('@/components/dashboard/TrendingPages').then(module => ({ default: module.TrendingPages })));


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
    <DashboardLayout
      latestScan={latestScan}
      onNavigateToScan={handleNavigateToScan}
    >
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
            <DashboardView.Root scanData={latestScan?.results} loading={scanLoading}>
              {/* Primary/Above-the-fold content - Load immediately */}
              <DashboardView.GridItem span="2" id="visibility">
                <DashboardView.Section>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                    <AIVisibilityScore scanData={latestScan?.results} />
                  </Suspense>
                </DashboardView.Section>
              </DashboardView.GridItem>

              <DashboardView.GridItem id="sentiment">
                <DashboardView.Section>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                    <SentimentAnalysis scanData={latestScan?.results} />
                  </Suspense>
                </DashboardView.Section>
              </DashboardView.GridItem>

              {/* Below-the-fold content - Lazy load with intersection observer */}
              <DashboardView.GridItem id="citations">
                <LazyComponentWrapper>
                  <DashboardView.Section>
                    <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                      <CitationsTracking scanData={latestScan?.results} />
                    </Suspense>
                  </DashboardView.Section>
                </LazyComponentWrapper>
              </DashboardView.GridItem>

              <DashboardView.GridItem id="rankings">
                <LazyComponentWrapper>
                  <DashboardView.Section>
                    <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                      <AIRankings scanData={latestScan?.results} />
                    </Suspense>
                  </DashboardView.Section>
                </LazyComponentWrapper>
              </DashboardView.GridItem>

              <DashboardView.GridItem>
                <LazyComponentWrapper>
                  <DashboardView.Section>
                    <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                      <PromptTrends scanData={latestScan?.results} />
                    </Suspense>
                  </DashboardView.Section>
                </LazyComponentWrapper>
              </DashboardView.GridItem>

              <DashboardView.GridItem>
                <LazyComponentWrapper>
                  <DashboardView.Section>
                    <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                      <CompetitorTraffic scanData={latestScan?.results} />
                    </Suspense>
                  </DashboardView.Section>
                </LazyComponentWrapper>
              </DashboardView.GridItem>

              <DashboardView.GridItem span="2">
                <LazyComponentWrapper>
                  <DashboardView.Section>
                    <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded"></div>}>
                      <TrendingPages scanData={latestScan?.results} />
                    </Suspense>
                  </DashboardView.Section>
                </LazyComponentWrapper>
              </DashboardView.GridItem>
            </DashboardView.Root>
          )}
        </DashboardErrorBoundary>
      </PaywallOverlay>
      
      <OnboardingTour 
        startTour={startTour} 
        onComplete={() => setStartTour(false)}
      />
    </DashboardLayout>
  );
};

export default Dashboard;