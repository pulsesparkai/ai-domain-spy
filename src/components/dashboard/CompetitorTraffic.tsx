import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { callEdgeFunction } from '@/lib/api-client';
import { LazyBarChart, BarChartSkeleton } from '@/components/lazy/LazyChartComponents';

interface CompetitorTrafficProps {
  scanData?: any;
}

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
          const data = await callEdgeFunction('trends-analysis', {
            competitors,
            timeframe: 'month'
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
          <LazyBarChart
            data={trafficData}
            dataKey="interestScore"
            xAxisKey="competitor"
            height={300}
            color="#4A90E2"
          />
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