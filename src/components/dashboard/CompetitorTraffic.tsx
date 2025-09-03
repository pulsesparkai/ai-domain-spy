import { memo, useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lazy } from 'react';

// Lazy load Recharts components
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));

interface CompetitorTrafficProps {
  scanData?: any;
}

const ChartSkeleton = () => (
  <div className="h-64 flex items-center justify-center">
    <div className="animate-pulse">
      <div className="w-full h-48 bg-muted rounded mb-4"></div>
      <div className="flex justify-center space-x-4">
        <div className="w-16 h-4 bg-muted rounded"></div>
        <div className="w-16 h-4 bg-muted rounded"></div>
        <div className="w-16 h-4 bg-muted rounded"></div>
      </div>
    </div>
  </div>
);

export const CompetitorTraffic = memo(({ scanData }: CompetitorTrafficProps) => {
  const [trafficData, setTrafficData] = useState<any[]>([]);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        // Extract competitors from scan data
        const competitors = Object.keys(scanData?.aggregates?.citationDomains || {})
          .slice(0, 5)
          .map(domain => domain.replace(/^www\./, ''));

        if (competitors.length > 0) {
          const { data } = await supabase.functions.invoke('trends-analysis', {
            body: { competitors, timeframe: 'month' }
          });

          if (data?.trendsData) {
            setTrafficData(data.trendsData);
          }
        }
      } catch (error) {
        console.error('Error fetching traffic data:', error);
      }
    };

    if (scanData) {
      fetchTraffic();
    }
  }, [scanData]);

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          Competitor Traffic
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trafficData.length > 0 ? (
          <Suspense fallback={<ChartSkeleton />}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="competitor" />
                  <YAxis />
                  <Bar dataKey="interestScore" fill="#4A90E2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Suspense>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No competitor traffic data available
          </p>
        )}
      </CardContent>
    </Card>
  );
});

CompetitorTraffic.displayName = 'CompetitorTraffic';