import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Info } from 'lucide-react';
import { TooltipWrapper } from '@/components/TooltipWrapper';

interface AIVisibilityScoreProps {
  scanData?: any;
}

export const AIVisibilityScore = memo(({ scanData }: AIVisibilityScoreProps) => {
  const score = scanData?.aggregates?.visibilityScore || 0;
  const color = score >= 70 ? '#4CAF50' : score >= 40 ? '#FF9800' : '#F44336';
  
  return (
    <Card className="shadow-card visibility-score animate-fade-in">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          AI Visibility Score
          <TooltipWrapper
            content="Composite score: (primary*10 + secondary*5 + mentions*2)/total *100. Based on citations and rankings across Perplexity and ChatGPT."
            side="right"
          >
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          </TooltipWrapper>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2 transition-all duration-500 text-primary">
            {score}
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mb-4">
            <div 
              className="h-2 rounded-full transition-all duration-500 bg-primary" 
              style={{ 
                width: `${score}%`
              }}
            ></div>
          </div>
          <p className="text-muted-foreground">
            {score >= 70 ? 'Excellent' : score >= 40 ? 'Good' : 'Needs improvement'} visibility across AI platforms
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

AIVisibilityScore.displayName = 'AIVisibilityScore';