import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';

interface AIRankingsProps {
  scanData?: any;
}

export const AIRankings = memo(({ scanData }: AIRankingsProps) => {
  const rankings = scanData?.aggregates?.rankings || [];
  
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'primary': return '#4CAF50';
      case 'secondary': return '#FF9800';
      default: return '#F44336';
    }
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          AI Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scanData?.results?.length > 0 ? scanData.results.map((result: any, index: number) => (
            <div key={index} className="border rounded-lg p-3 sm:p-4 hover-scale transition-all duration-200 bg-card">
              <div className="font-medium text-sm sm:text-base mb-3 line-clamp-2">{result.query}</div>
              
              {/* Desktop view */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Perplexity</span>
                  <Badge 
                    className="text-white"
                    style={{ 
                      backgroundColor: getRankColor(result.rankings?.perplexity)
                    }}
                  >
                    {result.rankings?.perplexity || 'none'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">ChatGPT</span>
                  <Badge 
                    className="text-white"
                    style={{ 
                      backgroundColor: getRankColor(result.rankings?.chatgpt)
                    }}
                  >
                    {result.rankings?.chatgpt || 'none'}
                  </Badge>
                </div>
              </div>

              {/* Mobile view - stacked */}
              <div className="block sm:hidden space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-medium text-muted-foreground">Perplexity</span>
                  <Badge 
                    className="text-white text-xs"
                    style={{ 
                      backgroundColor: getRankColor(result.rankings?.perplexity)
                    }}
                  >
                    {result.rankings?.perplexity || 'none'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-border">
                  <span className="text-xs font-medium text-muted-foreground">ChatGPT</span>
                  <Badge 
                    className="text-white text-xs"
                    style={{ 
                      backgroundColor: getRankColor(result.rankings?.chatgpt)
                    }}
                  >
                    {result.rankings?.chatgpt || 'none'}
                  </Badge>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center">No ranking data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

AIRankings.displayName = 'AIRankings';