import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LazyPieChart } from '@/components/lazy/LazyChartComponents';

interface SentimentAnalysisProps {
  scanData?: any;
}

export const SentimentAnalysis = memo(({ scanData }: SentimentAnalysisProps) => {
  const sentiment = scanData?.aggregates?.sentiment || { positive: 0, neutral: 0, negative: 0 };
  
  const data = [
    { name: 'Positive', value: sentiment.positive },
    { name: 'Neutral', value: sentiment.neutral },
    { name: 'Negative', value: sentiment.negative }
  ];

  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  const colors = ['#4CAF50', '#9E9E9E', '#F44336'];

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
          <div className="space-y-4">
            <LazyPieChart
              data={data}
              dataKey="value"
              nameKey="name"
              height={300}
              colors={colors}
            />
            <div className="flex justify-center space-x-4 mt-4">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center hover-scale">
                  <div
                    className="w-3 h-3 rounded-full mr-2 bg-primary"
                    style={{ backgroundColor: colors[index] }}
                  ></div>
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
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