import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ExternalLink, Quote } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PerplexityResult {
  content: string;
  citations: Array<{
    url: string;
    title?: string;
    snippet?: string;
  }>;
  model: string;
}

export const PerplexityInsights = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PerplexityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://api.pulsespark.ai/api/perplexity/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Search failed: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      
      toast({
        title: "Search Complete",
        description: "Perplexity search results retrieved successfully",
      });
    } catch (error) {
      console.error('Perplexity search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Perplexity AI Search
          </CardTitle>
          <CardDescription>
            Search for real-time information and get AI-powered insights with citations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your search query..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !query.trim()}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <Quote className="h-4 w-4" />
              <span className="font-medium">Search Error</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-4">
          {/* AI Response */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                AI Response
                <Badge variant="outline" className="text-xs">
                  {results.model || 'Perplexity'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {results.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Citations */}
          {results.citations && results.citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="h-5 w-5 text-primary" />
                  Sources & Citations
                  <Badge variant="secondary" className="text-xs">
                    {results.citations.length} sources
                  </Badge>
                </CardTitle>
                <CardDescription>
                  References and sources used to generate the response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {results.citations.map((citation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline truncate"
                          >
                            {citation.title || new URL(citation.url).hostname}
                          </a>
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {citation.url}
                        </p>
                        {citation.snippet && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {citation.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !error && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Search</h3>
            <p className="text-muted-foreground mb-4">
              Enter a query above to get AI-powered search results with real-time information and citations.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>• Ask questions about current events</p>
              <p>• Research topics with citations</p>
              <p>• Get comprehensive answers from multiple sources</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};