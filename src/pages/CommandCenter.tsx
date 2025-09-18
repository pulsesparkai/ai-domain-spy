import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Eye, Zap, Clock, ExternalLink, Trash2, Play, CheckCircle, XCircle, Minus, Bell, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ScanHistoryTable } from '@/components/ScanHistoryTable';
import { useScanHistoryStore } from '@/store/scanHistoryStore';
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';
import { ActivityFeed } from '@/components/ActivityFeed';
import { RealtimeMetrics } from '@/components/RealtimeMetrics';
import { NotificationBadge } from '@/components/NotificationBadge';

interface ScanRecord {
  id: string;
  created_at: string;
  target_url: string;
  scan_type: string;
  status: string;
  results: any;
  citations: any[];
}

interface PlatformStatus {
  platform: string;
  status: 'operational' | 'degraded' | 'down';
  lastChecked: string;
  responseTime: number;
}

export const CommandCenter = () => {
  const navigate = useNavigate();
  const { 
    scans, 
    loading: scanHistoryLoading, 
    loadScans, 
    deleteScan: deleteScanFromStore,
    getReadinessScore,
    getCitationsCount 
  } = useScanHistoryStore();
  const { 
    activityFeed, 
    metrics, 
    hasNewNotifications, 
    markNotificationsAsRead,
    clearActivityFeed 
  } = useRealtimeMonitoring();
  const [loading, setLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState(87);
  const [scoreHistory] = useState([
    { date: '2024-01', score: 72 },
    { date: '2024-02', score: 78 },
    { date: '2024-03', score: 82 },
    { date: '2024-04', score: 85 },
    { date: '2024-05', score: 87 },
  ]);

  const [platformStatuses] = useState<PlatformStatus[]>([
    { platform: 'Perplexity', status: 'operational', lastChecked: '2 min ago', responseTime: 245 },
    { platform: 'ChatGPT', status: 'operational', lastChecked: '3 min ago', responseTime: 312 },
    { platform: 'Claude', status: 'operational', lastChecked: '1 min ago', responseTime: 189 },
  ]);

  const [recentCitations] = useState([
    { platform: 'Perplexity', url: 'example.com', query: 'AI tools comparison', timestamp: '5 min ago' },
    { platform: 'Perplexity', url: 'demo-site.com', query: 'best practices guide', timestamp: '12 min ago' },
    { platform: 'Perplexity', url: 'test.com', query: 'industry analysis', timestamp: '1 hour ago' },
  ]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  // Sync current score with real-time metrics
  useEffect(() => {
    if (metrics.visibilityScore > 0) {
      setCurrentScore(Math.round(metrics.visibilityScore));
    }
  }, [metrics.visibilityScore]);

  // Additional mock real-time updates for demonstration
  useEffect(() => {
    const additionalUpdates = setInterval(() => {
      // Slight random variation in score
      setCurrentScore(prev => {
        const variation = (Math.random() - 0.5) * 2; // -1 to +1
        return Math.max(0, Math.min(100, Math.round(prev + variation)));
      });
    }, 45000); // Every 45 seconds, different from main interval
    
    return () => clearInterval(additionalUpdates);
  }, []);


  const getStatusIcon = (status: 'operational' | 'degraded' | 'down') => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };


  if (scanHistoryLoading && scans.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">
            Real-time AI visibility monitoring and control center
          </p>
        </div>
        <Button onClick={() => navigate('/scan')} className="gap-2">
          <Play className="h-4 w-4" />
          New Scan
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Visibility Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentScore}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last week
            </p>
            <Progress value={currentScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scans.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Citations</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scans.reduce((total, scan) => total + getCitationsCount(scan), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Live mentions found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Scan History</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="relative"
            onClick={markNotificationsAsRead}
          >
            Activity Feed
            <NotificationBadge 
              hasNotifications={hasNewNotifications} 
              className="ml-2" 
              showIcon={false}
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Real-time Metrics */}
          <RealtimeMetrics metrics={metrics} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visibility Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Visibility Trend</CardTitle>
                <CardDescription>AI visibility score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Citations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Citations</CardTitle>
                <CardDescription>Latest mentions across AI platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCitations.map((citation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{citation.platform}</Badge>
                          <span className="text-sm font-medium">{citation.url}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{citation.query}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {citation.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Status */}
          <Card>
            <CardHeader>
              <CardTitle>AI Platform Status</CardTitle>
              <CardDescription>Real-time status of AI platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {platformStatuses.map((platform) => (
                  <div key={platform.platform} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{platform.platform}</h4>
                      {getStatusIcon(platform.status)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Status: <span className="capitalize text-foreground">{platform.status}</span></div>
                      <div>Response: {platform.responseTime}ms</div>
                      <div>Last checked: {platform.lastChecked}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScanHistoryTable showFilters={true} />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Perplexity Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Perplexity AI
                </CardTitle>
                <CardDescription>Live monitoring active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span className="font-medium">245ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span className="font-medium text-green-600">99.8%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Check</span>
                    <span className="font-medium">2 min ago</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Metrics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ChatGPT Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="h-5 w-5 text-gray-500" />
                  ChatGPT
                </CardTitle>
                <CardDescription>Integration pending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    ChatGPT monitoring will be available in a future update. 
                    Currently preparing integration for real-time visibility tracking.
                  </div>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Claude Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="h-5 w-5 text-gray-500" />
                  Claude
                </CardTitle>
                <CardDescription>Integration pending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Claude monitoring will be available in a future update. 
                    Currently preparing integration for real-time visibility tracking.
                  </div>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed 
            activities={activityFeed} 
            onClear={clearActivityFeed}
            showClearButton={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommandCenter;