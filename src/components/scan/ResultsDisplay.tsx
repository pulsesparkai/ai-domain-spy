import { Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { TooltipWrapper } from "@/components/TooltipWrapper";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Lazy load Recharts components
const LazyPieChart = lazy(() => import("recharts").then(module => ({ default: module.PieChart })));

interface ResultsDisplayProps {
  results: any;
}

export const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  const sentimentColors = {
    positive: "#4CAF50",
    neutral: "#9E9E9E", 
    negative: "#F44336"
  };

  const sentimentData = results?.aggregates?.sentimentBreakdown ? [
    { name: 'Positive', value: results.aggregates.sentimentBreakdown.positive, color: sentimentColors.positive },
    { name: 'Neutral', value: results.aggregates.sentimentBreakdown.neutral, color: sentimentColors.neutral },
    { name: 'Negative', value: results.aggregates.sentimentBreakdown.negative, color: sentimentColors.negative },
  ] : [];

  if (!results) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 scan-results">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Sentiment Analysis
            <TooltipWrapper
              id="sentiment-tooltip"
              content="Shows the emotional tone of mentions: positive, neutral, or negative sentiment across all platforms"
            >
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipWrapper>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading chart...</div>}>
            <ResponsiveContainer width="100%" height={200}>
              <LazyPieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </LazyPieChart>
            </ResponsiveContainer>
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Visibility Score
            <TooltipWrapper
              id="visibility-tooltip"
              content="Composite score: (primary*10 + secondary*5 + mentions*2)/total *100. Higher scores indicate better AI platform visibility"
            >
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipWrapper>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 visibility-score">
            <div className="flex justify-between">
              <span>Primary Mentions</span>
              <Badge variant="default">{results.aggregates?.primaryRank || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Secondary Mentions</span>
              <Badge variant="secondary">{results.aggregates?.secondaryRank || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>No Ranking</span>
              <Badge variant="outline">{results.aggregates?.noRank || 0}</Badge>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {results.aggregates?.visibilityScore || 0}
                </div>
                <div className="text-sm text-muted-foreground">Visibility Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};