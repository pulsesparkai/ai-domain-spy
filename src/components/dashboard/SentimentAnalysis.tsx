import { memo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { lazy } from 'react';

// Lazy load Recharts components
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })));
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));

interface SentimentAnalysisProps {
  scanData?: any;
}

const ChartSkeleton = () => (
  <div className="h-64 flex items-center justify-center">
    <div className="animate-pulse">
      <div className="w-32 h-32 rounded-full bg-muted mx-auto mb-4"></div>
      <div className="flex justify-center space-x-4">
        <div className="w-16 h-4 bg-muted rounded"></div>
        <div className="w-16 h-4 bg-muted rounded"></div>
        <div className="w-16 h-4 bg-muted rounded"></div>
      </div>
    </div>
  </div>
);

export const SentimentAnalysis = memo(({ scanData }: SentimentAnalysisProps) => {
  const sentiment = scanData?.aggregates?.sentiment || { positive: 0, neutral: 0, negative: 0 };
  
  const data = [
    { name: 'Positive', value: sentiment.positive, color: '#4CAF50' },
    { name: 'Neutral', value: sentiment.neutral, color: '#9E9E9E' },
    { name: 'Negative', value: sentiment.negative, color: '#F44336' }
  ];

  const total = sentiment.positive + sentiment.neutral + sentiment.negative;

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <Suspense fallback={<ChartSkeleton />}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-4">
                {data.map((entry) => (
                  <div key={entry.name} className="flex items-center hover-scale">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-sm">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Suspense>
        ) : (
          <div className="text-center text-muted-foreground">
            No sentiment data available
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SentimentAnalysis.displayName = 'SentimentAnalysis';