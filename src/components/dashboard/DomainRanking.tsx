import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Award, Clock, Globe, Star, BarChart3, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { showToast } from '@/lib/toast';

interface DomainMetrics {
  domain: string;
  aiVisibilityScore: number;
  traditionalSeoScore: number;
  citationCount: number;
  freshness: number;
  authority: number;
  rankingPosition: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  aiPlatforms: {
    perplexity: number;
    chatgpt: number;
    claude: number;
    bard: number;
  };
  contentQuality: {
    readability: number;
    depth: number;
    accuracy: number;
    engagement: number;
  };
}

interface CompetitorRanking {
  domain: string;
  company: string;
  rank: number;
  score: number;
  change: number;
  aiCitations: number;
  marketShare: number;
}

const DomainRanking: React.FC = () => {
  const { brandProfile } = useBrandProfile();
  const [domainMetrics, setDomainMetrics] = useState<DomainMetrics | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (brandProfile?.brand_domain) {
      fetchDomainRankingData();
    }
  }, [brandProfile]);

  const fetchDomainRankingData = async () => {
    setLoading(true);
    try {
      // Mock data - in production this would fetch real domain ranking data
      const mockMetrics: DomainMetrics = {
        domain: brandProfile?.brand_domain || 'example.com',
        aiVisibilityScore: 72,
        traditionalSeoScore: 68,
        citationCount: 45,
        freshness: 85,
        authority: 65,
        rankingPosition: 3,
        trend: 'up',
        lastUpdated: new Date().toISOString(),
        aiPlatforms: {
          perplexity: 78,
          chatgpt: 71,
          claude: 69,
          bard: 74
        },
        contentQuality: {
          readability: 82,
          depth: 75,
          accuracy: 88,
          engagement: 71
        }
      };

      const mockCompetitors: CompetitorRanking[] = [
        {
          domain: 'competitor1.com',
          company: 'Leading Corp',
          rank: 1,
          score: 89,
          change: 2,
          aiCitations: 67,
          marketShare: 25
        },
        {
          domain: 'competitor2.com', 
          company: 'Major Brand',
          rank: 2,
          score: 84,
          change: -1,
          aiCitations: 58,
          marketShare: 20
        },
        {
          domain: brandProfile?.brand_domain || 'yourdomain.com',
          company: brandProfile?.brand_name || 'Your Company',
          rank: 3,
          score: 72,
          change: 3,
          aiCitations: 45,
          marketShare: 15
        },
        {
          domain: 'competitor3.com',
          company: 'Tech Solutions',
          rank: 4,
          score: 69,
          change: -2,
          aiCitations: 41,
          marketShare: 12
        },
        {
          domain: 'competitor4.com',
          company: 'Industry Player',
          rank: 5,
          score: 64,
          change: 1,
          aiCitations: 38,
          marketShare: 10
        }
      ];

      setDomainMetrics(mockMetrics);
      setCompetitors(mockCompetitors);
    } catch (error) {
      console.error('Error fetching domain ranking data:', error);
      showToast.error('Failed to fetch domain ranking data');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
  };

  if (!brandProfile?.brand_domain) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Domain Ranking Analysis</h3>
          <p className="text-muted-foreground mb-4">
            Set up your brand profile with a domain to track AI visibility rankings
          </p>
          <Button onClick={() => window.location.href = '/settings'}>
            Add Domain
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Analyzing domain rankings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Domain Ranking Analysis</h2>
          <p className="text-muted-foreground">
            Track your domain's performance across AI platforms and search results
          </p>
        </div>
        <Button onClick={fetchDomainRankingData}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Current Position Overview */}
      <Card className="border-primary bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Current AI Ranking Position
            </CardTitle>
            {domainMetrics && getTrendIcon(domainMetrics.trend)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">#{domainMetrics?.rankingPosition}</p>
              <p className="text-sm text-muted-foreground">Overall Rank</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${getScoreColor(domainMetrics?.aiVisibilityScore || 0)}`}>
                {domainMetrics?.aiVisibilityScore}
              </p>
              <p className="text-sm text-muted-foreground">AI Visibility Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{domainMetrics?.citationCount}</p>
              <p className="text-sm text-muted-foreground">AI Citations</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${getScoreColor(domainMetrics?.authority || 0)}`}>
                {domainMetrics?.authority}
              </p>
              <p className="text-sm text-muted-foreground">Domain Authority</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">AI Platforms</TabsTrigger>
          <TabsTrigger value="quality">Content Quality</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">AI Visibility Score</span>
                    <span className="font-medium">{domainMetrics?.aiVisibilityScore}%</span>
                  </div>
                  <Progress value={domainMetrics?.aiVisibilityScore} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Traditional SEO Score</span>
                    <span className="font-medium">{domainMetrics?.traditionalSeoScore}%</span>
                  </div>
                  <Progress value={domainMetrics?.traditionalSeoScore} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Content Freshness</span>
                    <span className="font-medium">{domainMetrics?.freshness}%</span>
                  </div>
                  <Progress value={domainMetrics?.freshness} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Domain Authority</span>
                    <span className="font-medium">{domainMetrics?.authority}%</span>
                  </div>
                  <Progress value={domainMetrics?.authority} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Ranking Improved</p>
                      <p className="text-sm text-green-600">Moved up 3 positions this week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Star className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">New Citations</p>
                      <p className="text-sm text-blue-600">Found in 5 new AI responses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Globe className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-800">Authority Boost</p>
                      <p className="text-sm text-purple-600">Domain authority increased by 5 points</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {domainMetrics && Object.entries(domainMetrics.aiPlatforms).map(([platform, score]) => (
              <Card key={platform}>
                <CardHeader>
                  <CardTitle className="capitalize">{platform}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold">{score}%</span>
                    <Badge variant={score >= 75 ? 'default' : score >= 50 ? 'secondary' : 'outline'}>
                      {score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work'}
                    </Badge>
                  </div>
                  <Progress value={score} className="mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Visibility score on {platform} platform
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Quality Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {domainMetrics && Object.entries(domainMetrics.contentQuality).map(([metric, score]) => (
                  <div key={metric}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm capitalize">{metric}</span>
                      <span className={`font-medium ${getScoreColor(score)}`}>{score}%</span>
                    </div>
                    <Progress value={score} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Visibility Rankings</CardTitle>
              <p className="text-muted-foreground">
                See how you stack up against competitors in AI search results
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitors.map((competitor, index) => (
                  <div 
                    key={competitor.domain}
                    className={`p-4 border rounded-lg ${
                      competitor.domain === brandProfile?.brand_domain 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-bold ${
                          competitor.rank <= 3 ? 'text-primary' : 'text-gray-600'
                        }`}>
                          #{competitor.rank}
                        </div>
                        <div>
                          <h3 className="font-semibold">{competitor.company}</h3>
                          <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getScoreColor(competitor.score)}`}>
                            {competitor.score}
                          </span>
                          <div className="flex items-center gap-1">
                            {getChangeIcon(competitor.change)}
                            <span className="text-sm">{Math.abs(competitor.change)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {competitor.aiCitations} citations
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Market Share</span>
                        <span className="text-xs">{competitor.marketShare}%</span>
                      </div>
                      <Progress value={competitor.marketShare * 4} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DomainRanking;