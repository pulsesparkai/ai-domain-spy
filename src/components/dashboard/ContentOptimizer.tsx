import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Target, CheckCircle, AlertCircle, TrendingUp, Wand2, Copy, RefreshCw, BarChart3 } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { showToast } from '@/lib/toast';
import { useBrandProfile } from '@/hooks/useBrandProfile';

interface OptimizationSuggestion {
  type: 'critical' | 'important' | 'minor';
  category: 'structure' | 'content' | 'keywords' | 'citations' | 'freshness';
  title: string;
  description: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  example?: string;
  implemented?: boolean;
}

interface ContentAnalysis {
  overallScore: number;
  readabilityScore: number;
  seoScore: number;
  aiOptimizationScore: number;
  citationPotential: number;
  suggestions: OptimizationSuggestion[];
  keywords: string[];
  competitorInsights: string[];
}

const ContentOptimizer: React.FC = () => {
  const { brandProfile } = useBrandProfile();
  const [contentUrl, setContentUrl] = useState('');
  const [contentText, setContentText] = useState('');
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');

  const analyzeContent = async () => {
    if (!contentUrl && !contentText.trim()) {
      showToast.error('Please provide either a URL or content text to analyze');
      return;
    }

    setLoading(true);
    try {
      // Mock analysis - in production this would use AI to analyze content
      const mockAnalysis: ContentAnalysis = {
        overallScore: 73,
        readabilityScore: 82,
        seoScore: 68,
        aiOptimizationScore: 71,
        citationPotential: 75,
        keywords: [
          'AI search optimization',
          'content strategy',
          'digital marketing',
          'search visibility',
          'brand awareness'
        ],
        competitorInsights: [
          'Competitors are using more structured data markup',
          'Industry leaders focus on FAQ-style content',
          'Recent trending topics include AI transparency and ethics'
        ],
        suggestions: [
          {
            type: 'critical',
            category: 'structure',
            title: 'Add FAQ Section',
            description: 'AI models heavily favor FAQ-style content for direct answers. Add a comprehensive FAQ section.',
            impact: 85,
            effort: 'medium',
            example: 'Q: What is [your topic]? A: [Direct, comprehensive answer]'
          },
          {
            type: 'critical',
            category: 'citations',
            title: 'Include Authoritative Sources',
            description: 'Reference high-authority sources to increase citation-worthiness.',
            impact: 90,
            effort: 'low',
            example: 'According to [Authority Source], [supporting fact or statistic]'
          },
          {
            type: 'important',
            category: 'content',
            title: 'Improve Content Depth',
            description: 'Add more comprehensive explanations and real-world examples.',
            impact: 75,
            effort: 'high',
            example: 'Include step-by-step guides, case studies, and practical examples'
          },
          {
            type: 'important',
            category: 'keywords',
            title: 'Optimize for Voice Queries',
            description: 'Include natural language patterns that match voice search queries.',
            impact: 70,
            effort: 'medium',
            example: 'How to [action], What is the best way to [action], Why does [topic] matter'
          },
          {
            type: 'minor',
            category: 'freshness',
            title: 'Add Current Statistics',
            description: 'Include recent data and statistics to improve content freshness.',
            impact: 60,
            effort: 'low',
            example: 'Latest 2024 statistics show that [relevant data point]'
          }
        ]
      };

      setAnalysis(mockAnalysis);
      showToast.success('Content analysis completed');
    } catch (error) {
      console.error('Error analyzing content:', error);
      showToast.error('Failed to analyze content');
    } finally {
      setLoading(false);
    }
  };

  const implementSuggestion = (suggestionIndex: number) => {
    if (analysis) {
      const updatedSuggestions = [...analysis.suggestions];
      updatedSuggestions[suggestionIndex] = {
        ...updatedSuggestions[suggestionIndex],
        implemented: true
      };
      
      setAnalysis({
        ...analysis,
        suggestions: updatedSuggestions
      });
      
      showToast.success('Suggestion marked as implemented');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast.success('Copied to clipboard');
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500';
      case 'important': return 'bg-yellow-500';
      case 'minor': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSuggestionTypeText = (type: string) => {
    switch (type) {
      case 'critical': return 'Critical';
      case 'important': return 'Important';
      case 'minor': return 'Minor';
      default: return 'Unknown';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Optimizer</h2>
          <p className="text-muted-foreground">
            Analyze and optimize your content for maximum AI visibility
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze">Analyze Content</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="tracking">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Content Analysis Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content URL (optional)</label>
                <Input
                  placeholder="https://example.com/your-content"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Or paste content text</label>
                <Textarea
                  placeholder="Paste your content here for analysis..."
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  rows={6}
                />
              </div>

              <Button onClick={analyzeContent} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Content...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Analyze Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{analysis.overallScore}</p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{analysis.readabilityScore}</p>
                    <p className="text-sm text-muted-foreground">Readability</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{analysis.seoScore}</p>
                    <p className="text-sm text-muted-foreground">SEO Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{analysis.aiOptimizationScore}</p>
                    <p className="text-sm text-muted-foreground">AI Optimization</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{analysis.citationPotential}</p>
                    <p className="text-sm text-muted-foreground">Citation Potential</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Overall Optimization Score</span>
                      <span className="font-medium">{analysis.overallScore}%</span>
                    </div>
                    <Progress value={analysis.overallScore} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">AI Optimization Score</span>
                      <span className="font-medium">{analysis.aiOptimizationScore}%</span>
                    </div>
                    <Progress value={analysis.aiOptimizationScore} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Citation Potential</span>
                      <span className="font-medium">{analysis.citationPotential}%</span>
                    </div>
                    <Progress value={analysis.citationPotential} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {!analysis ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                <p className="text-muted-foreground">
                  Analyze your content first to see optimization suggestions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analysis.suggestions.map((suggestion, index) => (
                <Card key={index} className={suggestion.implemented ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getSuggestionTypeColor(suggestion.type)}`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{suggestion.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getSuggestionTypeText(suggestion.type)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {suggestion.implemented ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => implementSuggestion(index)}
                          >
                            Mark Done
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Impact: {suggestion.impact}%</span>
                        </div>
                        <div className={`flex items-center gap-1 ${getEffortColor(suggestion.effort)}`}>
                          <AlertCircle className="h-3 w-3" />
                          <span>Effort: {suggestion.effort}</span>
                        </div>
                      </div>
                    </div>
                    
                    {suggestion.example && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Example:</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(suggestion.example!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700 italic">{suggestion.example}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          {!analysis ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Progress to Track</h3>
                <p className="text-muted-foreground">
                  Complete a content analysis to start tracking your optimization progress
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Suggestions Implemented</span>
                        <span className="font-medium">
                          {analysis.suggestions.filter(s => s.implemented).length} / {analysis.suggestions.length}
                        </span>
                      </div>
                      <Progress 
                        value={(analysis.suggestions.filter(s => s.implemented).length / analysis.suggestions.length) * 100} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-lg font-bold text-red-600">
                          {analysis.suggestions.filter(s => s.type === 'critical' && !s.implemented).length}
                        </p>
                        <p className="text-sm text-red-600">Critical Items</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-lg font-bold text-yellow-600">
                          {analysis.suggestions.filter(s => s.type === 'important' && !s.implemented).length}
                        </p>
                        <p className="text-sm text-yellow-600">Important Items</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">
                          {analysis.suggestions.filter(s => s.implemented).length}
                        </p>
                        <p className="text-sm text-green-600">Completed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitor Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.competitorInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-800">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentOptimizer;