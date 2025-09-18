import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  ExternalLink, 
  TrendingUp, 
  Eye, 
  Users, 
  Globe, 
  CheckCircle,
  AlertTriangle,
  Star,
  Target,
  BookOpen,
  Lightbulb
} from "lucide-react";
import { TooltipWrapper } from "@/components/TooltipWrapper";
import { LazyPieChart } from "@/components/lazy/LazyChartComponents";

interface ResultsDisplayProps {
  results: any;
}

interface Citation {
  url?: string;
  title?: string;
  source?: string;
  authority?: string;
  snippet?: string;
}

interface PlatformPresence {
  [key: string]: boolean | string;
}

interface EntityAnalysis {
  brandMentions?: number;
  contentDepth?: number;
  authorityScore?: number;
  topicRelevance?: number;
}

export const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  // Add debug logging
  console.log('ResultsDisplay received:', results);
  
  if (!results) {
    return null;
  }

  // Extract data with proper fallbacks
  const readinessScore = results?.readinessScore || 
                        results?.perplexity_signals?.ranking_potential || 
                        results?.aggregates?.visibilityScore || 0;

  const citations: Citation[] = results?.citations || [];
  const platformPresence: PlatformPresence = results?.platformPresence || {};
  const entityAnalysis: EntityAnalysis = results?.entityAnalysis || {};

  // Sentiment data for chart
  const sentimentData = results?.aggregates?.sentimentBreakdown ? [
    { name: 'Positive', value: results.aggregates.sentimentBreakdown.positive },
    { name: 'Neutral', value: results.aggregates.sentimentBreakdown.neutral },
    { name: 'Negative', value: results.aggregates.sentimentBreakdown.negative },
  ] : [];

  const sentimentColors = ["#4CAF50", "#9E9E9E", "#F44336"];

  // Get recommendations with fallbacks
  const recommendations = results?.recommendations || 
                         results?.perplexity_signals?.content_gaps || 
                         [];

  // Platform presence indicators
  const platformIcons: { [key: string]: any } = {
    reddit: Users,
    youtube: Globe,
    linkedin: Users,
    twitter: Globe,
    github: BookOpen,
    medium: BookOpen,
    stackoverflow: Target
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return Target;
  };

  return (
    <div className="space-y-6 scan-results">
      {/* Readiness Score - Prominent Display */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-6 w-6" />
            AI Readiness Score
            <TooltipWrapper
              id="readiness-tooltip"
              content="Overall assessment of how well your content is optimized for AI platform discovery"
            >
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipWrapper>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - readinessScore / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{Math.round(readinessScore)}</div>
                  <div className="text-xs text-muted-foreground">out of 100</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className={`p-3 rounded-lg border ${getScoreColor(readinessScore)}`}>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getScoreIcon(readinessScore);
                    return <Icon className="h-5 w-5" />;
                  })()}
                  <span className="font-medium">
                    {readinessScore >= 80 ? "Excellent" : 
                     readinessScore >= 60 ? "Good" : "Needs Improvement"}
                  </span>
                </div>
                <p className="text-sm mt-1">
                  {readinessScore >= 80 ? "Your content is well-optimized for AI discovery" :
                   readinessScore >= 60 ? "Your content has good potential with some improvements" :
                   "Significant optimization opportunities available"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citations Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Citations Found ({citations.length})
              <TooltipWrapper
                id="citations-tooltip"
                content="Existing mentions of your content or brand across AI platforms"
              >
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipWrapper>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {citations.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {citations.map((citation, index) => (
                  <div key={index} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {citation.source && (
                            <Badge variant="secondary" className="text-xs">
                              {citation.source}
                            </Badge>
                          )}
                          {citation.authority && (
                            <Badge variant="outline" className="text-xs">
                              {citation.authority}
                            </Badge>
                          )}
                        </div>
                        {citation.title && (
                          <h4 className="font-medium text-sm truncate">{citation.title}</h4>
                        )}
                        {citation.snippet && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {citation.snippet}
                          </p>
                        )}
                      </div>
                      {citation.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() => window.open(citation.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No citations found</p>
                <p className="text-xs">Your content may not be widely referenced yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Presence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Platform Presence
              <TooltipWrapper
                id="platform-tooltip"
                content="Presence and mentions across different platforms and social media"
              >
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipWrapper>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(platformPresence).map(([platform, presence]) => {
                const IconComponent = platformIcons[platform.toLowerCase()] || Globe;
                const isPresent = Boolean(presence);
                
                return (
                  <div 
                    key={platform}
                    className={`p-3 rounded-lg border transition-colors ${
                      isPresent ? 'bg-green-50 border-green-200' : 'bg-muted/50 border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${isPresent ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium capitalize">{platform}</span>
                    </div>
                    <div className={`text-xs mt-1 ${isPresent ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {isPresent ? 'Active presence' : 'No presence detected'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Analysis Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Content Analysis
              <TooltipWrapper
                id="analysis-tooltip"
                content="Detailed analysis of your content quality and brand authority"
              >
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipWrapper>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entityAnalysis.brandMentions !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Brand Mentions</span>
                  <span className="font-medium">{entityAnalysis.brandMentions}</span>
                </div>
                <Progress value={Math.min(entityAnalysis.brandMentions * 10, 100)} />
              </div>
            )}
            
            {entityAnalysis.contentDepth !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Content Depth</span>
                  <span className="font-medium">{entityAnalysis.contentDepth}%</span>
                </div>
                <Progress value={entityAnalysis.contentDepth} />
              </div>
            )}
            
            {entityAnalysis.authorityScore !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Authority Score</span>
                  <span className="font-medium">{entityAnalysis.authorityScore}%</span>
                </div>
                <Progress value={entityAnalysis.authorityScore} />
              </div>
            )}
            
            {entityAnalysis.topicRelevance !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Topic Relevance</span>
                  <span className="font-medium">{entityAnalysis.topicRelevance}%</span>
                </div>
                <Progress value={entityAnalysis.topicRelevance} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        {sentimentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Sentiment Analysis
                <TooltipWrapper
                  id="sentiment-tooltip"
                  content="Emotional tone of mentions: positive, neutral, or negative sentiment"
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipWrapper>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded" />}>
                <LazyPieChart
                  data={sentimentData}
                  dataKey="value"
                  nameKey="name"
                  height={200}
                  colors={sentimentColors}
                />
              </Suspense>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommendations for Improvement
              <TooltipWrapper
                id="recommendations-tooltip"
                content="AI-generated suggestions to improve your content's discoverability"
              >
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipWrapper>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec: string, index: number) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-900">{rec}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy visibility score display for backward compatibility */}
      {results?.aggregates && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detailed Visibility Metrics
              <TooltipWrapper
                id="legacy-visibility-tooltip"
                content="Breakdown of visibility rankings across platforms"
              >
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipWrapper>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Primary Mentions</span>
                <Badge variant="default">{results.aggregates.primaryRank || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Secondary Mentions</span>
                <Badge variant="secondary">{results.aggregates.secondaryRank || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Other Mentions</span>
                <Badge variant="outline">{results.aggregates.noRank || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};