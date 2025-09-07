import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';

const PerplexityOptimizationCard = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  const analyzeForPerplexity = async () => {
    if (!url) {
      showToast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      // Ensure URL is properly formatted
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      // Validate URL format
      try {
        new URL(formattedUrl);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      const response = await fetch('https://api.pulsespark.ai/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formattedUrl })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Direct API call response:', data);
      
      // Check if result is valid before setting
      if (data && typeof data === 'object') {
        setAnalysis(data);
        setExpanded(true);
        showToast.success('Analysis complete!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Direct API call failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      showToast.error(`Analysis failed: ${errorMessage}`);
      // Don't crash - just reset the state
      setAnalysis(null);
      setExpanded(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <CardTitle>Perplexity AI Optimization Suite</CardTitle>
            <Badge variant="secondary">Beta</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!expanded ? (
          <div>
            <p className="text-muted-foreground mb-4">
              Analyze how well your website is optimized for Perplexity AI's ranking factors
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your domain (e.g., example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={analyzeForPerplexity} 
                disabled={loading || !url}
                className="min-w-[140px]"
              >
                {loading ? 'Analyzing...' : 'Analyze Website'}
              </Button>
            </div>
          </div>
        ) : analysis && (
          <div className="space-y-4">
            {/* Readiness Score */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Perplexity Readiness Score</h3>
                <p className="text-sm text-muted-foreground">
                  Based on 59 ranking patterns
                </p>
              </div>
              <div className="text-3xl font-bold text-primary">
                {analysis.readinessScore}/100
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Content Depth</div>
                <div className="text-xl font-semibold">{analysis.contentAnalysis.depth}%</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Brand Authority</div>
                <div className="text-xl font-semibold">{analysis.entityAnalysis.brandStrength}%</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Platform Coverage</div>
                <div className="text-xl font-semibold">
                  {Object.values(analysis.platformPresence).filter((p: any) => p.found).length}/5
                </div>
              </div>
            </div>

            {/* Critical Recommendations */}
            {analysis.recommendations.critical.length > 0 && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Critical Improvements Needed
                </h4>
                <ul className="space-y-1 text-sm">
                  {analysis.recommendations.critical.map((rec: string, i: number) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => {
                setExpanded(false);
                setAnalysis(null);
                setUrl('');
              }}
              className="w-full"
            >
              Analyze Another Site
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerplexityOptimizationCard;