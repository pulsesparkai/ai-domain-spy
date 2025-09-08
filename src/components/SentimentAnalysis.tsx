import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SentimentAnalysis = ({ scanData }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💭</span> Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No sentiment data available
          </p>
        </div>
      </CardContent>
    </Card>
  );
};