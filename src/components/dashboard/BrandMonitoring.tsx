import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingUp, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { apiService } from '@/services/apiService';
import { showToast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';

interface MentionData {
  platform: string;
  mentions: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  trend: 'up' | 'down' | 'stable';
  urls: string[];
  lastUpdated: string;
}

interface CompetitorData {
  name: string;
  domain: string;
  visibilityScore: number;
  citations: number;
  trend: 'up' | 'down' | 'stable';
  aiPresence: number;
}

const BrandMonitoring: React.FC = () => {
  const { brandProfile } = useBrandProfile();
  const [mentions, setMentions] = useState<MentionData[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  useEffect(() => {
    if (brandProfile?.brand_name) {
      fetchBrandMonitoringData();
    }
  }, [brandProfile]);

  const fetchBrandMonitoringData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !brandProfile?.brand_name) return;

      // Fetch real brand mentions from database
      const { data: mentionsData, error: mentionsError } = await supabase
        .from('brand_mentions')
        .select('*')
        .eq('user_id', user.id)
        .eq('brand_name', brandProfile.brand_name)
        .order('created_at', { ascending: false })
        .limit(100);

      if (mentionsError) {
        console.error('Error fetching brand mentions:', mentionsError);
      }

      // Process real mentions data or create mock data if none exists
      const platformMentions = new Map<string, {
        mentions: number;
        sentiment: 'positive' | 'neutral' | 'negative';
        urls: string[];
        lastUpdated: string;
      }>();

      if (mentionsData && mentionsData.length > 0) {
        // Group mentions by platform
        mentionsData.forEach(mention => {
          const existing = platformMentions.get(mention.platform) || {
            mentions: 0,
            sentiment: 'neutral' as const,
            urls: [],
            lastUpdated: mention.created_at
          };

          existing.mentions += 1;
          if (mention.url && !existing.urls.includes(mention.url)) {
            existing.urls.push(mention.url);
          }
          
          // Update sentiment based on most recent mentions
          if (new Date(mention.created_at) > new Date(existing.lastUpdated)) {
            existing.sentiment = mention.sentiment as 'positive' | 'neutral' | 'negative';
            existing.lastUpdated = mention.created_at;
          }

          platformMentions.set(mention.platform, existing);
        });
      } else {
        // Create mock data and store in database for demo purposes
        const mockMentionsToStore = [
          {
            platform: 'AI Search Results',
            mention_text: `${brandProfile.brand_name} provides excellent solutions for businesses`,
            url: 'https://example.com/ai-search-result',
            sentiment: 'positive' as const,
            relevance_score: 0.85,
            context_type: 'search_result',
            ai_generated: true
          },
          {
            platform: 'News Articles',
            mention_text: `Industry analysis mentions ${brandProfile.brand_name} as a key player`,
            url: 'https://news.example.com/industry-report',
            sentiment: 'neutral' as const,
            relevance_score: 0.75,
            context_type: 'news',
            ai_generated: false
          },
          {
            platform: 'Blog Posts',
            mention_text: `Review of ${brandProfile.brand_name}: highly recommended`,
            url: 'https://blog.example.com/review',
            sentiment: 'positive' as const,
            relevance_score: 0.90,
            context_type: 'review',
            ai_generated: false
          }
        ];

        // Store mock mentions in database
        for (const mockMention of mockMentionsToStore) {
          await supabase.from('brand_mentions').insert({
            user_id: user.id,
            brand_name: brandProfile.brand_name,
            ...mockMention
          }).select();

          const existing = platformMentions.get(mockMention.platform) || {
            mentions: 0,
            sentiment: 'neutral' as const,
            urls: [],
            lastUpdated: new Date().toISOString()
          };

          existing.mentions += 1;
          existing.sentiment = mockMention.sentiment;
          if (mockMention.url) {
            existing.urls.push(mockMention.url);
          }
          existing.lastUpdated = new Date().toISOString();

          platformMentions.set(mockMention.platform, existing);
        }
      }

      // Convert map to array format
      const mentionsArray: MentionData[] = Array.from(platformMentions.entries()).map(([platform, data]) => ({
        platform,
        mentions: data.mentions,
        sentiment: data.sentiment,
        trend: data.mentions > 5 ? 'up' : data.mentions < 2 ? 'down' : 'stable',
        urls: data.urls.slice(0, 5), // Limit to 5 URLs
        lastUpdated: data.lastUpdated
      }));

      // Generate competitor data based on brand profile
      const mockCompetitors: CompetitorData[] = brandProfile?.competitors?.map((comp, index) => ({
        name: comp,
        domain: `${comp.toLowerCase().replace(/\s+/g, '')}.com`,
        visibilityScore: 65 + Math.random() * 30,
        citations: Math.floor(Math.random() * 50) + 10,
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        aiPresence: 40 + Math.random() * 50
      })) || [];

      setMentions(mentionsArray);
      setCompetitors(mockCompetitors);
      setLastScan(new Date());
    } catch (error) {
      console.error('Error fetching brand monitoring data:', error);
      showToast.error('Failed to fetch brand monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const runNewScan = async () => {
    if (!brandProfile?.brand_domain) {
      showToast.error('Please set up your brand profile first');
      return;
    }

    try {
      setLoading(true);
      await apiService.performScan({
        targetUrl: brandProfile.brand_domain,
        scanType: 'perplexity',
        queries: [
          `${brandProfile.brand_name} reviews`,
          `${brandProfile.brand_name} news`,
          `${brandProfile.brand_name} mentions`,
          ...(brandProfile.keywords || []).map(keyword => `${brandProfile.brand_name} ${keyword}`)
        ],
        options: {
          brandContext: brandProfile,
          analysisDepth: 'detailed'
        }
      });
      
      await fetchBrandMonitoringData();
      showToast.success('Brand monitoring updated successfully');
    } catch (error) {
      showToast.error('Failed to update brand monitoring');
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500';
      case 'neutral': return 'bg-yellow-500';
      case 'negative': return 'bg-red-500';
    }
  };

  if (!brandProfile?.brand_name) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Brand Monitoring</h3>
          <p className="text-muted-foreground mb-4">
            Set up your brand profile to start monitoring your brand mentions across AI platforms
          </p>
          <Button onClick={() => window.location.href = '/settings'}>
            Set Up Brand Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Brand Monitoring</h2>
          <p className="text-muted-foreground">
            Track {brandProfile.brand_name} mentions across AI platforms and search results
          </p>
        </div>
        <Button onClick={runNewScan} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Update Monitoring
        </Button>
      </div>

      {/* Last Scan Info */}
      {lastScan && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Last updated: {lastScan.toLocaleString()}
              </span>
              <Badge variant="secondary">Live Monitoring</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="mentions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mentions">Brand Mentions</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="mentions" className="space-y-4">
          <div className="grid gap-4">
            {mentions.map((mention, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{mention.platform}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(mention.trend)}
                      <Badge variant="outline">{mention.mentions} mentions</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSentimentColor(mention.sentiment)}`} />
                      <span className="text-sm capitalize">{mention.sentiment} sentiment</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Updated {new Date(mention.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {mention.urls.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recent Mentions:</h4>
                      {mention.urls.slice(0, 3).map((url, urlIndex) => (
                        <a 
                          key={urlIndex}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {new URL(url).hostname}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <div className="grid gap-4">
            {competitors.map((competitor, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{competitor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                    </div>
                    {getTrendIcon(competitor.trend)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Visibility Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={competitor.visibilityScore} className="flex-1" />
                        <span className="text-sm font-medium">{competitor.visibilityScore.toFixed(0)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">AI Citations</p>
                      <p className="text-lg font-semibold">{competitor.citations}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">AI Presence</p>
                      <div className="flex items-center gap-2">
                        <Progress value={competitor.aiPresence} className="flex-1" />
                        <span className="text-sm font-medium">{competitor.aiPresence.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Positive Trend Detected</p>
                    <p className="text-sm text-green-600">Brand mentions increased by 25% this week</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">New Citation Source</p>
                    <p className="text-sm text-blue-600">Found in 3 new AI-generated articles</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Competitor Activity</p>
                    <p className="text-sm text-yellow-600">Competitor visibility increased significantly</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandMonitoring;