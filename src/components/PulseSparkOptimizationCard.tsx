import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertCircle, FileText, Globe } from 'lucide-react';
import { PulseSparkAIAgent } from '@/services/ai';
import { showToast } from '@/lib/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  onAnalysisComplete?: (data: any) => void;
}

const PulseSparkOptimizationCard = ({ onAnalysisComplete }: Props) => {
  const [url, setUrl] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url');

  const analyzeContent = async () => {
    const input = inputMode === 'url' ? url : manualContent;
    
    if (!input) {
      showToast.error(inputMode === 'url' ? 'Please enter a URL' : 'Please paste website content');
      return;
    }

    setLoading(true);
    try {
      const agent = new PulseSparkAIAgent();
      const result = await agent.analyzeWebsite(
        input.trim(), 
        { isManualContent: inputMode === 'manual' }
      );
      
      // Add domain to result
      const resultWithDomain = {
        ...result,
        domain: inputMode === 'url' ? url.trim() : 'Manual Content Analysis'
      };
      
      console.log('Analysis result:', resultWithDomain);
      setAnalysis(resultWithDomain);
      setExpanded(true);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(resultWithDomain);
      }
      
      showToast.success('Analysis complete!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Check if it's a robots.txt or llms.txt block
      if (error.message.includes('blocks automated analysis') || 
          error.message.includes('llms.txt') || 
          error.message.includes('robots.txt')) {
        showToast.error('Website blocks AI crawling. Please use the Manual Content tab to paste content directly.');
        setInputMode('manual');
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
          <div>
            <p className="text-muted-foreground mb-4">
              Analyze your website for Perplexity AI optimization using 59 ranking signals
            </p>
            
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'url' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">
                  <Globe className="w-4 h-4 mr-2" />
                  Website URL
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <FileText className="w-4 h-4 mr-2" />
                  Paste Content
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your domain (e.g., example.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && analyzeContent()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={analyzeContent} 
                    disabled={loading || !url}
                    className="min-w-[140px]"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Website'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  We check both robots.txt and llms.txt for AI crawling permissions.
                </p>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Manual Content Collection Guide
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>What to copy:</strong></p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Homepage main content and hero section</li>
                      <li>About page or company description</li>
                      <li>Key product/service pages</li>
                      <li>FAQ sections and how-to guides</li>
                      <li>Any data, charts, or research content</li>
                      <li>Author bios and credentials</li>
                    </ul>
                    <p className="mt-2"><strong>How to copy:</strong> Right-click → "View Page Source" or Ctrl+U, then copy the text content (not HTML tags).</p>
                  </div>
                </div>
                <Textarea
                  placeholder="Paste your website content here (focus on main pages, about section, key content)..."
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="min-h-[200px]"
                />
                <Button 
                  onClick={analyzeContent} 
                  disabled={loading || !manualContent}
                  className="w-full"
                >
                  {loading ? 'Analyzing Perplexity Signals...' : 'Analyze Content for Perplexity'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  We'll analyze your content for all 59 Perplexity ranking factors including question-answer format, expert citations, data visualization, and content structure.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        ) : analysis && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Perplexity AI Readiness Score</h3>
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
