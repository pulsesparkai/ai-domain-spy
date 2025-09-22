import { Suspense, useState } from "react";
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
  Lightbulb,
  Download,
  Mail,
  Share,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Youtube,
  Linkedin,
  MessageSquare,
  HelpCircle,
  FileText,
  TrendingDown
} from "lucide-react";
import { TooltipWrapper } from "@/components/TooltipWrapper";
import { LazyPieChart } from "@/components/lazy/LazyChartComponents";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExportButton } from "@/components/ExportButton";

interface ResultsDisplayProps {
  results: any;
}

interface Citation {
  url?: string;
  title?: string;
  source?: string;
  authority?: string;
  snippet?: string;
  domain?: string;
}

interface PlatformPresence {
  [key: string]: boolean | string | number;
}

interface EntityAnalysis {
  brandMentions?: number;
  contentDepth?: number;
  authorityScore?: number;
  topicRelevance?: number;
}

export const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  // Results data received and processed
  
  const [expandedCitationGroups, setExpandedCitationGroups] = useState<{[key: string]: boolean}>({});
  
  if (!results) {
    return null;
  }

  // Fix extraction - data is nested under 'analysis'
  const readinessScore = results?.readinessScore || 
                        results?.analysis?.perplexity_signals?.ranking_potential ||
                        results?.aggregates?.visibilityScore || 0;
  
  const citations: Citation[] = results?.citations || 
                               results?.analysis?.citations || 
                               [];
  
  const platformPresence: PlatformPresence = results?.platformPresence || 
                                           results?.analysis?.platformPresence || {};
  
  const entityAnalysis: EntityAnalysis = results?.entityAnalysis || 
                                       results?.analysis?.entityAnalysis || {};
  
  const recommendations = results?.recommendations || 
                         results?.analysis?.recommendations || [];

  // Sentiment data for chart
  const sentimentData = results?.sentiment ? [
    { name: 'Positive', value: results.sentiment.positive || 0, fill: '#10b981' },
    { name: 'Neutral', value: results.sentiment.neutral || 0, fill: '#6b7280' },
    { name: 'Negative', value: results.sentiment.negative || 0, fill: '#ef4444' }
  ] : [];

  // Platform icons mapping
  const platformIcons: { [key: string]: any } = {
    reddit: MessageSquare,
    youtube: Youtube,
    linkedin: Linkedin,
    twitter: MessageSquare,
    quora: HelpCircle,
    news: FileText,
    medium: FileText,
    github: Globe,
    stackoverflow: MessageSquare
  };

  // Helper functions
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 border-green-200 bg-green-50";
    if (score >= 60) return "text-yellow-600 border-yellow-200 bg-yellow-50";
    return "text-red-600 border-red-200 bg-red-50";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-8 w-8 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
    return <TrendingDown className="h-8 w-8 text-red-600" />;
  };

  const getRadialData = (score: number) => [
    {
      name: 'Score',
      value: score,
      fill: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
    }
  ];

  // Group citations by domain
  const groupedCitations = citations.reduce((acc: {[key: string]: Citation[]}, citation) => {
    const domain = citation.domain || citation.source || 'Unknown';
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(citation);
    return acc;
  }, {});

  // Generate insights
  const generateInsights = () => {
    const strengths = [];
    const improvements = [];
    const quickWins = [];

    if (readinessScore >= 80) {
      strengths.push("Excellent AI visibility score");
    } else if (readinessScore >= 60) {
      improvements.push("Moderate AI visibility - room for improvement");
    } else {
      improvements.push("Low AI visibility requires attention");
    }

    if (citations.length > 5) {
      strengths.push(`Strong citation presence (${citations.length} sources)`);
    } else if (citations.length > 0) {
      improvements.push("Limited citation diversity");
      quickWins.push("Increase content authority and citations");
    } else {
      improvements.push("No citations found");
      quickWins.push("Create cite-worthy content and build authority");
    }

    if (Object.values(platformPresence).filter(Boolean).length > 3) {
      strengths.push("Good platform presence");
    } else {
      improvements.push("Limited platform presence");
      quickWins.push("Expand presence on AI platforms");
    }

    return { strengths: strengths.slice(0, 3), improvements: improvements.slice(0, 3), quickWins: quickWins.slice(0, 3) };
  };

  const insights = generateInsights();

  const toggleCitationGroup = (domain: string) => {
    setExpandedCitationGroups(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };

  return (
    <div className="space-y-6 scan-results animate-fade-in">
      {/* Header with Export Options */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Scan Results</h2>
        <div className="flex gap-2">
          <ExportButton data={results} filename="scan-results" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="w-4 h-4 mr-2" />
                Email Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Score Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Circular Progress Indicator */}
        <Card className={`col-span-1 lg:col-span-2 border-2 ${getScoreColor(readinessScore)}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              {getScoreIcon(readinessScore)}
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
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="90%" 
                    startAngle={90} 
                    endAngle={-270} 
                    data={getRadialData(readinessScore)}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      fill={readinessScore >= 80 ? '#10b981' : readinessScore >= 60 ? '#f59e0b' : '#ef4444'}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{readinessScore}</div>
                    <div className="text-sm text-muted-foreground">out of 100</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {readinessScore >= 80 && "Excellent AI visibility"}
              {readinessScore >= 60 && readinessScore < 80 && "Good AI visibility with room for improvement"}
              {readinessScore < 60 && "Needs improvement for better AI visibility"}
            </div>
          </CardContent>
        </Card>

        {/* Insights Panel */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {insights.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {insights.improvements.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {insights.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{improvement}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.quickWins.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-600 mb-2 flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Quick Wins
                </h4>
                <ul className="space-y-1">
                  {insights.quickWins.map((win, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{win}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Presence Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Presence
            <Badge variant="secondary">{Object.values(platformPresence).filter(Boolean).length} active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(platformPresence).map(([platform, status]) => {
              const IconComponent = platformIcons[platform.toLowerCase()] || Globe;
              const isActive = Boolean(status);
              
              return (
                <div
                  key={platform}
                  className={`p-4 rounded-lg border-2 transition-all hover-scale ${
                    isActive 
                      ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                      : 'border-red-200 bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="relative">
                      <IconComponent className={`w-8 h-8 ${isActive ? 'text-green-600' : 'text-red-400'}`} />
                      <div className="absolute -top-1 -right-1">
                        {isActive ? (
                          <Check className="w-4 h-4 text-green-600 bg-white rounded-full" />
                        ) : (
                          <X className="w-4 h-4 text-red-400 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-sm capitalize">{platform}</div>
                      {typeof status === 'number' && status > 0 && (
                        <div className="text-xs text-muted-foreground">{status} mentions</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Citations Display */}
      {citations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Citations Found
              <Badge variant="secondary">{citations.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedCitations).map(([domain, domainCitations]) => (
                <Collapsible 
                  key={domain}
                  open={expandedCitationGroups[domain]}
                  onOpenChange={() => toggleCitationGroup(domain)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} 
                          alt={`${domain} favicon`}
                          className="w-4 h-4"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="font-medium">{domain}</span>
                        <Badge variant="outline">{domainCitations.length}</Badge>
                      </div>
                      {expandedCitationGroups[domain] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {domainCitations.map((citation, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            {citation.title && (
                              <h4 className="font-medium text-sm mb-1">{citation.title}</h4>
                            )}
                            {citation.snippet && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {citation.snippet}
                              </p>
                            )}
                            {citation.authority && (
                              <Badge variant="outline" className="text-xs">
                                {citation.authority}
                              </Badge>
                            )}
                          </div>
                          {citation.url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={citation.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Analysis Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Brand Mentions</span>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">{entityAnalysis.brandMentions || 0}</div>
            <Progress value={(entityAnalysis.brandMentions || 0) * 10} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Content Depth</span>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">{entityAnalysis.contentDepth || 0}%</div>
            <Progress value={entityAnalysis.contentDepth || 0} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Authority Score</span>
              <Star className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">{entityAnalysis.authorityScore || 0}%</div>
            <Progress value={entityAnalysis.authorityScore || 0} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Topic Relevance</span>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">{entityAnalysis.topicRelevance || 0}%</div>
            <Progress value={entityAnalysis.topicRelevance || 0} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Analysis */}
      {sentimentData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Suspense fallback={<div className="flex items-center justify-center h-full">Loading chart...</div>}>
                <LazyPieChart data={sentimentData} dataKey="value" nameKey="name" />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};