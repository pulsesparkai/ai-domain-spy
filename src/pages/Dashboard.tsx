import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { OnboardingTour } from "@/components/OnboardingTour";
import { BarChart3, Brain, TrendingUp, Users, Search, Target, Globe, ArrowUp, ArrowDown } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { Tooltip } from 'react-tooltip';
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import 'react-tooltip/dist/react-tooltip.css';

const AIVisibilityScore = ({ scanData }: { scanData?: any }) => {
  const score = scanData?.aggregates?.visibilityScore || 0;
  const color = score >= 70 ? '#4CAF50' : score >= 40 ? '#FF9800' : '#F44336';
  
  return (
    <Card className="shadow-card visibility-score">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          AI Visibility Score
          <span 
            data-tooltip-id="visibility-score-tooltip"
            className="cursor-help text-muted-foreground"
          >
            ℹ️
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2" style={{ color }}>
            {score}
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mb-4">
            <div 
              className="h-2 rounded-full transition-all duration-500" 
              style={{ 
                width: `${score}%`,
                background: `linear-gradient(90deg, ${color} 0%, ${color}AA 100%)`
              }}
            ></div>
          </div>
          <p className="text-muted-foreground">
            {score >= 70 ? 'Excellent' : score >= 40 ? 'Good' : 'Needs improvement'} visibility across AI platforms
          </p>
        </div>
      </CardContent>
      <Tooltip id="visibility-score-tooltip" place="top">
        Composite score: (primary*10 + secondary*5 + mentions*2)/total *100. Based on citations and rankings across Perplexity and ChatGPT.
      </Tooltip>
    </Card>
  );
};

const CitationsTracking = ({ scanData }: { scanData?: any }) => {
  const domains = scanData?.aggregates?.citationDomains || {};
  const totalCitations = scanData?.aggregates?.totalCitations || 0;
  
  const topDomains = Object.entries(domains)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <Card className="shadow-card citations-tracking">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          Citations Tracking
          <span 
            data-tooltip-id="citations-tooltip"
            className="cursor-help text-muted-foreground"
          >
            ℹ️
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalCitations}</div>
            <div className="text-sm text-muted-foreground">Total Citations</div>
          </div>
          <div className="space-y-2">
            {topDomains.length > 0 ? topDomains.map(([domain, count], index) => (
              <div key={domain} className="flex justify-between items-center">
                <span className="text-sm truncate">{domain}</span>
                <Badge variant={index === 0 ? "default" : "secondary"}>
                  {count as number}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center">No citations found</p>
            )}
          </div>
        </div>
      </CardContent>
      <Tooltip id="citations-tooltip" place="top">
        Shows domains that cite or mention your brand across AI platforms, with citation counts.
      </Tooltip>
    </Card>
  );
};

const SentimentAnalysis = ({ scanData }: { scanData?: any }) => {
  const sentiment = scanData?.aggregates?.sentiment || { positive: 0, neutral: 0, negative: 0 };
  
  const data = [
    { name: 'Positive', value: sentiment.positive, color: '#4CAF50' },
    { name: 'Neutral', value: sentiment.neutral, color: '#9E9E9E' },
    { name: 'Negative', value: sentiment.negative, color: '#F44336' }
  ];

  const total = sentiment.positive + sentiment.neutral + sentiment.negative;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {data.map((entry) => (
                <div key={entry.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            No sentiment data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AIRankings = ({ scanData }: { scanData?: any }) => {
  const rankings = scanData?.aggregates?.rankings || [];
  
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'primary': return '#4CAF50';
      case 'secondary': return '#FF9800';
      default: return '#F44336';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          AI Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {scanData?.results?.length > 0 ? scanData.results.map((result: any, index: number) => (
            <div key={index} className="border rounded p-3">
              <div className="font-medium text-sm mb-2">{result.query}</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Perplexity</span>
                <Badge 
                  style={{ 
                    backgroundColor: getRankColor(result.rankings?.perplexity),
                    color: 'white'
                  }}
                >
                  {result.rankings?.perplexity || 'none'}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">ChatGPT</span>
                <Badge 
                  style={{ 
                    backgroundColor: getRankColor(result.rankings?.chatgpt),
                    color: 'white'
                  }}
                >
                  {result.rankings?.chatgpt || 'none'}
                </Badge>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center">No ranking data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PromptTrends = ({ scanData }: { scanData?: any }) => {
  const [trendsData, setTrendsData] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrends = async () => {
      if (!user || !scanData) return;
      
      try {
        // Get previous scan for comparison
        const { data: previousScans } = await supabase
          .from('scans')
          .select('results')
          .eq('user_id', user.id)
          .neq('id', scanData.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (previousScans && previousScans.length > 0) {
          const previousResults = previousScans[0].results as any;
          const currentQueries = scanData.results?.map((r: any) => r.query) || [];
          const previousQueries = previousResults?.results?.map((r: any) => r.query) || [];
          
          const gained = currentQueries.filter((q: string) => !previousQueries.includes(q));
          const lost = previousQueries.filter((q: string) => !currentQueries.includes(q));
          
          setTrendsData({ gained, lost });
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
      }
    };

    fetchTrends();
  }, [user, scanData]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Search className="w-5 h-5 text-accent" />
          Prompt Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trendsData ? (
          <div className="space-y-4">
            {trendsData.gained.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-green-600 flex items-center">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  Gained Queries
                </h4>
                {trendsData.gained.map((query: string, index: number) => (
                  <div key={index} className="text-sm bg-green-50 p-2 rounded">
                    {query}
                  </div>
                ))}
              </div>
            )}
            {trendsData.lost.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-red-600 flex items-center">
                  <ArrowDown className="w-4 h-4 mr-1" />
                  Lost Queries
                </h4>
                {trendsData.lost.map((query: string, index: number) => (
                  <div key={index} className="text-sm bg-red-50 p-2 rounded">
                    {query}
                  </div>
                ))}
              </div>
            )}
            {trendsData.gained.length === 0 && trendsData.lost.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                No changes from previous scan
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Run multiple scans to see trends
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const CompetitorTraffic = ({ scanData }: { scanData?: any }) => {
  const [trafficData, setTrafficData] = useState<any[]>([]);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        // Extract competitors from scan data
        const competitors = Object.keys(scanData?.aggregates?.citationDomains || {})
          .slice(0, 5)
          .map(domain => domain.replace(/^www\./, ''));

        if (competitors.length > 0) {
          const { data } = await supabase.functions.invoke('trends-analysis', {
            body: { competitors, timeframe: 'month' }
          });

          if (data?.trendsData) {
            setTrafficData(data.trendsData);
          }
        }
      } catch (error) {
        console.error('Error fetching traffic data:', error);
      }
    };

    if (scanData) {
      fetchTraffic();
    }
  }, [scanData]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          Competitor Traffic
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trafficData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competitor" />
                <YAxis />
                <Bar dataKey="interestScore" fill="#4A90E2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No competitor traffic data available
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const TrendingPages = ({ scanData }: { scanData?: any }) => {
  const [pagesData, setPagesData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const competitors = Object.keys(scanData?.aggregates?.citationDomains || {})
          .slice(0, 3);

        if (competitors.length > 0) {
          const { data } = await supabase.functions.invoke('trending-pages', {
            body: { competitors, days: 30 }
          });

          if (data?.pages) {
            setPagesData(data.pages);
          }
        }
      } catch (error) {
        console.error('Error fetching trending pages:', error);
      }
    };

    if (scanData) {
      fetchPages();
    }
  }, [scanData]);

  const groupedPages = pagesData.reduce((acc, page) => {
    if (!acc[page.competitor]) acc[page.competitor] = [];
    acc[page.competitor].push(page);
    return acc;
  }, {});

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          Trending Pages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedPages).length > 0 ? (
          <Accordion type="single" collapsible>
            {Object.entries(groupedPages).map(([competitor, pages]: [string, any]) => (
              <AccordionItem key={competitor} value={competitor}>
                <AccordionTrigger className="text-sm font-medium">
                  {competitor} ({pages.length} pages)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {pages.slice(0, 5).map((page: any, index: number) => (
                      <div key={index} className="border rounded p-2 text-xs">
                        <div className="font-medium">{page.title}</div>
                        <div className="text-muted-foreground mt-1">
                          {new Date(page.publishedDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No trending pages data available
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [startTour, setStartTour] = useState(false);
  const [latestScan, setLatestScan] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      analytics.page('Dashboard', { userId: user.id });
      setStartTour(true);
      
      // Fetch latest scan data
      const fetchLatestScan = async () => {
        try {
          const { data } = await supabase
            .from('scans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (data && data.length > 0) {
            setLatestScan(data[0]);
          }
        } catch (error) {
          console.error('Error fetching scan data:', error);
        }
      };

      fetchLatestScan();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar className="w-64 border-r border-border bg-sidebar">
            <SidebarContent className="p-4">
              <div className="space-y-4">
                <div className="text-sidebar-foreground font-semibold">Dashboard</div>
                <nav className="space-y-2">
                  <a href="#visibility" className="block px-3 py-2 rounded-md bg-primary text-primary-foreground">
                    AI Visibility
                  </a>
                  <a href="#citations" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent">
                    Citations
                  </a>
                  <a href="#sentiment" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent">
                    Sentiment
                  </a>
                  <a href="#rankings" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent">
                    Rankings
                  </a>
                </nav>
              </div>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Visibility Dashboard</h1>
                <p className="text-muted-foreground">
                  {latestScan ? 
                    `Last scan: ${new Date(latestScan.created_at).toLocaleDateString()}` :
                    'Run your first scan to see data here'
                  }
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                >
                  Run New Scan
                </Button>
                <SidebarTrigger />
              </div>
            </div>

            <PaywallOverlay>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AIVisibilityScore scanData={latestScan?.results} />
                </div>
                <div>
                  <SentimentAnalysis scanData={latestScan?.results} />
                </div>
                <CitationsTracking scanData={latestScan?.results} />
                <AIRankings scanData={latestScan?.results} />
                <PromptTrends scanData={latestScan?.results} />
                <CompetitorTraffic scanData={latestScan?.results} />
                <div className="lg:col-span-2">
                  <TrendingPages scanData={latestScan?.results} />
                </div>
              </div>
            </PaywallOverlay>
          </main>
        </div>
      </SidebarProvider>
      
      <OnboardingTour 
        startTour={startTour} 
        onComplete={() => setStartTour(false)}
      />
    </div>
  );
};

export default Dashboard;