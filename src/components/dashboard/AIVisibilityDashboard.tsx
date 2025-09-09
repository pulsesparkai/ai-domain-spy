import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Target, BarChart3, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { VisibilityChart } from '@/components/charts/VisibilityChart';
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis';
import { KeywordRankings } from '@/components/KeywordRankings';

interface Props {
  analysisData?: any;
  scanData?: any;
  lastScanDate?: string;
}

export const AIVisibilityDashboard = ({ analysisData, scanData, lastScanDate }: Props) => {
  const readinessScore = analysisData?.readinessScore || 0;
  const contentDepth = analysisData?.contentAnalysis?.depth || 0;
  const brandAuthority = analysisData?.entityAnalysis?.brandStrength || 0;
  const totalCitations = analysisData?.entityAnalysis?.mentions || scanData?.aggregates?.totalCitations || 0;
  
  const platformPresence = analysisData?.platformPresence || {};
  
  const platforms = [
    { name: 'Reddit', key: 'reddit', icon: '🔴', color: 'text-red-500' },
    { name: 'YouTube', key: 'youtube', icon: '📺', color: 'text-red-600' },
    { name: 'LinkedIn', key: 'linkedin', icon: '💼', color: 'text-blue-600' },
    { name: 'Quora', key: 'quora', icon: '❓', color: 'text-red-700' },
    { name: 'News', key: 'news', icon: '📰', color: 'text-gray-600' }
  ];

  const recommendations = analysisData?.recommendations || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Visibility Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your website's performance across AI platforms
          </p>
        </div>
        {lastScanDate && (
          <div className="text-sm text-muted-foreground">
            Last scan: {new Date(lastScanDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Perplexity AI Readiness Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Readiness Score</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{readinessScore}/100</div>
            <Progress value={readinessScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {readinessScore >= 80 ? 'Excellent' : readinessScore >= 60 ? 'Good' : readinessScore >= 40 ? 'Fair' : 'Needs Work'}
            </p>
          </CardContent>
        </Card>

        {/* Content Depth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Depth</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentDepth}%</div>
            <Progress value={contentDepth} className="mt-2" />
          </CardContent>
        </Card>

        {/* Brand Authority */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand Authority</CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brandAuthority}%</div>
            <Progress value={brandAuthority} className="mt-2" />
          </CardContent>
        </Card>

        {/* Total Citations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Citations</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCitations}</div>
            <p className="text-xs text-muted-foreground">
              References found
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Presence Section */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Presence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {platforms.map(platform => {
              const platformData = platformPresence[platform.key];
              const isFound = platformData?.found || false;
              const count = platformData?.mentions || platformData?.videos || platformData?.followers || platformData?.questions || platformData?.articles || 0;
              
              return (
                <div key={platform.key} className="text-center">
                  <div className={`text-2xl mb-2 ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <p className="text-sm font-medium">{platform.name}</p>
                  <div className="flex items-center justify-center mt-1">
                    {isFound ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="ml-1 text-xs">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts and Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visibility Trend Chart */}
        <div>
          <VisibilityChart data={analysisData || scanData} />
        </div>
        
        {/* Competitor Analysis */}
        <div>
          <CompetitorAnalysis domain={analysisData?.domain || 'example.com'} />
        </div>
      </div>

      {/* Keyword Rankings Table */}
      <div>
        <KeywordRankings />
      </div>

      {/* Recommendations Sidebar */}
      {(recommendations.critical?.length || recommendations.important?.length) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Recommendations */}
          {recommendations.critical?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Critical Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.critical.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Recommendations */}
          {recommendations.important?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-warning" />
                  Important Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.important.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};