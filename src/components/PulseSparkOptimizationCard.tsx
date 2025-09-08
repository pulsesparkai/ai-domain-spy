import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertCircle, FileText } from 'lucide-react';
import { PulseSparkAIAgent } from '@/services/ai';
import { showToast } from '@/lib/toast';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  onAnalysisComplete?: (data: any) => void;
}

const PulseSparkOptimizationCard = ({ onAnalysisComplete }: Props) => {
  const [url, setUrl] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  const analyzeForPerplexity = async () => {
    const inputValue = showManualInput ? manualContent : url;
    if (!inputValue) {
      showToast.error(`Please enter ${showManualInput ? 'content' : 'a URL'}`);
      return;
    }

    setLoading(true);
    try {
      const agent = new PulseSparkAIAgent();
      const result = await agent.analyzeWebsite(inputValue.trim(), { 
        isManualContent: showManualInput 
      });
      
      // Add domain to result
      const resultWithDomain = {
        ...result,
        domain: showManualInput ? 'Manual Content' : url.trim()
      };
      
      console.log('Analysis result:', resultWithDomain);
      setAnalysis(resultWithDomain);
      setExpanded(true);
      
      // Pass data to parent
      if (onAnalysisComplete) {
        onAnalysisComplete(resultWithDomain);
      }
      
      showToast.success('Analysis complete!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      if (error.message === 'ROBOTS_BLOCKED') {
        showToast.error('This website blocks automated analysis. Try the manual content option.');
        setShowManualInput(true);
      } else {
        showToast.error(error.message || 'Analysis failed');
      }
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
            <CardTitle>PulseSpark AI Optimization Suite</CardTitle>
            <Badge variant="secondary">Beta</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!expanded ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Analyze how well your website is optimized for AI search platforms
            </p>
            
            <div className="flex gap-2 mb-4">
              <Button
                variant={!showManualInput ? "default" : "outline"}
                size="sm"
                onClick={() => setShowManualInput(false)}
                className="flex items-center gap-1"
              >
                <Brain className="w-4 h-4" />
                URL Analysis
              </Button>
              <Button
                variant={showManualInput ? "default" : "outline"}
                size="sm"
                onClick={() => setShowManualInput(true)}
                className="flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Manual Content
              </Button>
            </div>
            
            {!showManualInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your domain (e.g., example.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && analyzeForPerplexity()}
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
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste your website content here (about page, key landing pages, etc.) to analyze when automated scraping is blocked..."
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="w-full min-h-[120px]"
                />
                <Button 
                  onClick={analyzeForPerplexity} 
                  disabled={loading || !manualContent}
                  className="w-full"
                >
                  {loading ? 'Analyzing...' : 'Analyze Content'}
                </Button>
              </div>
            )}
          </div>
        ) : analysis && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Perplexity Readiness Score</h3>
                <p className="text-sm text-muted-foreground">Based on 59 ranking patterns</p>
              </div>
              <div className="text-3xl font-bold text-primary">
                {analysis.readinessScore}/100
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Content Depth</div>
                <div className="text-xl font-semibold">{analysis.contentAnalysis?.depth || 0}%</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Brand Authority</div>
                <div className="text-xl font-semibold">{analysis.entityAnalysis?.brandStrength || 0}%</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Citations</div>
                <div className="text-xl font-semibold">{analysis.entityAnalysis?.mentions || 0}</div>
              </div>
            </div>

            {/* Platform Presence */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3">Platform Presence</h4>
              <div className="grid grid-cols-5 gap-2 text-sm">
                {Object.entries(analysis.platformPresence || {}).map(([platform, data]: [string, any]) => (
                  <div key={platform} className="text-center">
                    <div className={`font-medium ${data.found ? 'text-green-600' : 'text-gray-400'}`}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </div>
                    <div className="text-xs">
                      {data.found ? '✓' : '✗'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations && (
              <div className="space-y-3">
                {analysis.recommendations.critical?.length > 0 && (
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      Critical Improvements
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {analysis.recommendations.critical.map((rec: string, i: number) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.recommendations.important?.length > 0 && (
                  <div className="p-4 bg-warning/10 rounded-lg">
                    <h4 className="font-medium mb-2">Important Recommendations</h4>
                    <ul className="space-y-1 text-sm">
                      {analysis.recommendations.important.map((rec: string, i: number) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
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

export default PulseSparkOptimizationCard;
