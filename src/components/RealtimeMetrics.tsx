import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, ExternalLink, MessageCircle, Zap } from 'lucide-react';
import { RealtimeMetrics as MetricsType } from '@/hooks/useRealtimeMonitoring';

interface RealtimeMetricsProps {
  metrics: MetricsType;
  className?: string;
}

export const RealtimeMetrics = ({ metrics, className }: RealtimeMetricsProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Visibility Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visibility Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.visibilityScore}</div>
          <Progress value={metrics.visibilityScore} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Real-time tracking
          </p>
        </CardContent>
      </Card>

      {/* Citations Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Live Citations</CardTitle>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.citationsCount}</div>
          <p className="text-xs text-muted-foreground">
            Found across AI platforms
          </p>
        </CardContent>
      </Card>

      {/* Mentions Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Mentions</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.mentionsCount}</div>
          <p className="text-xs text-muted-foreground">
            Across all platforms
          </p>
        </CardContent>
      </Card>

      {/* Active Platforms */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Platforms</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activePlatforms.length}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {metrics.activePlatforms.slice(0, 3).map((platform) => (
              <Badge key={platform} variant="secondary" className="text-xs">
                {platform}
              </Badge>
            ))}
            {metrics.activePlatforms.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{metrics.activePlatforms.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};