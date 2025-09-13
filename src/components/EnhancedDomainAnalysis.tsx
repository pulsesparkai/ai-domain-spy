import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, BarChart3, Network, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DomainAnalysisResult {
  scanId: string;
  url: string;
  analysis: {
    backlinks: Array<{
      url: string;
      domain: string;
      authority: number;
      anchor_text: string;
    }>;
    citations: Array<{
      url: string;
      title: string;
      domain: string;
      authority_type: string;
    }>;
    graph: {
      nodes: Array<{ id: string; label: string; type?: string }>;
      edges: Array<{ from: string; to: string; type: string }>;
    };
    referrals: Array<{
      source: string;
      estPercent: number;
    }>;
    perplexity_signals: {
      ranking_potential: number;
      content_gaps: string[];
      optimization_score: number;
    };
  };
  metadata: {
    content_fetched: boolean;
    fetch_error?: string;
    timestamp: string;
  };
}

export const EnhancedDomainAnalysis = () => {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DomainAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform domain analysis",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      console.log('Starting domain analysis for:', url);
      
      const { data, error: functionError } = await supabase.functions.invoke('analyze-website', {
        body: {
          url: url.trim(),
          userId: user.id
        }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Analysis failed');
      }

      if (data.error) {
        if (data.requiresManual) {
          toast({
            title: "Content Blocked",
            description: data.error,
            variant: "destructive",
          });
          setError(data.suggestion || data.error);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setResults(data);
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${data.url}`,
      });

    } catch (err: any) {
      console.error('Analysis error:', err);
      const errorMessage = err.message || 'Failed to analyze domain';
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatUrl = (url: string) => {
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Enhanced Domain Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter domain or URL (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={isAnalyzing}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !url.trim()}
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="grid gap-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analysis Overview</span>
                <Badge variant="secondary">
                  {formatUrl(results.url)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {results.analysis.perplexity_signals.ranking_potential}%
                  </div>
                  <div className="text-sm text-muted-foreground">Ranking Potential</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {results.analysis.perplexity_signals.optimization_score}%
                  </div>
                  <div className="text-sm text-muted-foreground">Optimization Score</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {results.analysis.backlinks.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Backlinks Found</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                AI Platform Referral Estimates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.analysis.referrals.map((referral, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{referral.source}</span>
                    <Badge variant="outline">{referral.estPercent}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Citations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Authority Citations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.analysis.citations.length > 0 ? (
                  results.analysis.citations.map((citation, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="font-medium">{citation.title}</div>
                      <div className="text-sm text-muted-foreground">{citation.domain}</div>
                      <Badge variant="secondary">{citation.authority_type}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No citations found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Gaps */}
          <Card>
            <CardHeader>
              <CardTitle>Content Optimization Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.analysis.perplexity_signals.content_gaps.map((gap, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm">{gap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Content Fetched:</span>{" "}
                  <Badge variant={results.metadata.content_fetched ? "default" : "secondary"}>
                    {results.metadata.content_fetched ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>{" "}
                  {new Date(results.metadata.timestamp).toLocaleString()}
                </div>
                {results.metadata.fetch_error && (
                  <div className="col-span-2">
                    <span className="font-medium">Fetch Error:</span>{" "}
                    <span className="text-muted-foreground">{results.metadata.fetch_error}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};