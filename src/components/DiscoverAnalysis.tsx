import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { showToast } from '@/lib/toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Search, 
  ExternalLink, 
  TrendingUp, 
  Lightbulb,
  BarChart3,
  Globe,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from './ui/alert';

interface DiscoverAnalysisProps {
  onAnalysisComplete?: (data: any) => void;
}

interface DiscoverResult {
  explanation: string;
  factors: Array<{
    name: string;
    score: number;
    details: string;
  }>;
  suggestions: string[];
}

export const DiscoverAnalysis = ({ onAnalysisComplete }: DiscoverAnalysisProps) => {
  const [contentUrl, setContentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiscoverResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeForDiscover = async () => {
    if (!contentUrl.trim() && !confirm('Run general Discover analysis without specific content?')) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to analyze content');
      }

      const response = await fetch('https://api.pulsespark.ai/api/discover-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contentUrl: contentUrl.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        showToast.error(`Error: ${response.status} - ${errorText}`);
        throw new Error(`Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setResult(data.analysis);
        onAnalysisComplete?.(data.analysis);
        toast({
          title: "Analysis Complete",
          description: "Discover ranking factors analyzed successfully"
        });
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error: any) {
      console.error('Discover analysis error:', error);
      const errorMessage = error.message || 'Analysis failed. Please try again.';
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Perplexity Discover Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter content URL to analyze (optional - leave blank for general analysis)"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={analyzeForDiscover}
              disabled={isAnalyzing}
              className="min-w-[120px]"
            >
              {isAnalyzing ? (
                <>
                  <BarChart3 className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Analyze why content appears on Perplexity Discover based on freshness, engagement, 
            semantic relevance, and authority signals.
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Analysis Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {result.explanation}
              </p>
            </CardContent>
          </Card>

          {/* Ranking Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Ranking Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{factor.name}</h4>
                        <Badge variant={getScoreBadgeVariant(factor.score)}>
                          {factor.score}/100
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{factor.details}</p>
                    </div>
                    
                    {/* Score Bar */}
                    <div className="ml-4 w-24">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            factor.score >= 80 ? 'bg-green-500' :
                            factor.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, factor.score))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Optimization Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content URL Info */}
          {contentUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Analyzed Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href={contentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {contentUrl}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};