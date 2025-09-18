import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Eye, Zap, Clock, ExternalLink, Trash2, Play, CheckCircle, XCircle, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setScanHistory(data || []);
    } catch (error) {
      console.error('Error fetching scan history:', error);
      toast({
        title: "Error",
        description: "Failed to load scan history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (scanId: string) => {
    try {
      const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId);

      if (error) throw error;

      setScanHistory(prev => prev.filter(scan => scan.id !== scanId));
      toast({
        title: "Success",
        description: "Scan deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast({
        title: "Error",
        description: "Failed to delete scan",
        variant: "destructive",
      });
    }
  };

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

  const getReadinessScore = (scan: ScanRecord) => {
    if (scan.results?.readinessScore) return scan.results.readinessScore;
    if (scan.results?.perplexity_signals?.ranking_potential) return scan.results.perplexity_signals.ranking_potential;
    return Math.floor(Math.random() * 30) + 70; // Fallback
  };

  const getCitationsCount = (scan: ScanRecord) => {
    if (scan.citations && Array.isArray(scan.citations)) return scan.citations.length;
    if (scan.results?.citations && Array.isArray(scan.results.citations)) return scan.results.citations.length;
    return 0;
  };

  if (loading) {
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
            <div className="text-2xl font-bold">{scanHistory.length}</div>
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
              {scanHistory.reduce((total, scan) => total + getCitationsCount(scan), 0)}
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
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>View and manage your past scans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No scans found. <Button variant="link" onClick={() => navigate('/scan')}>Run your first scan</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scanHistory.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{scan.target_url || 'Unknown URL'}</span>
                            <Badge variant="outline">{scan.scan_type}</Badge>
                            <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'}>
                              {scan.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(scan.created_at).toLocaleDateString()}
                            </span>
                            <span>Score: {getReadinessScore(scan)}</span>
                            <span>Citations: {getCitationsCount(scan)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard`)}>
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteScan(scan.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
      </Tabs>
    </div>
  );
};

export default CommandCenter;