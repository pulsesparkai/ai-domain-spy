import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Brain, TrendingUp, Users, Search, Target, Globe } from "lucide-react";

// Mock components for the 7 dashboard features
const AIVisibilityScore = () => (
  <Card className="shadow-card">
    <CardHeader>
      <CardTitle className="text-h3 flex items-center gap-2">
        <Brain className="w-5 h-5 text-accent" />
        AI Visibility Score
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center">
        <div className="text-5xl font-bold text-primary mb-2">87</div>
        <div className="w-full bg-secondary rounded-full h-2 mb-4">
          <div className="primary-gradient h-2 rounded-full" style={{ width: '87%' }}></div>
        </div>
        <p className="text-muted-foreground">Excellent visibility across AI platforms</p>
      </div>
    </CardContent>
  </Card>
);

const CitationsTracking = () => (
  <Card className="shadow-card">
    <CardHeader>
      <CardTitle className="text-h3 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-accent" />
        Citations Tracking
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-2 bg-secondary rounded">
          <span>Perplexity.ai</span>
          <span className="font-semibold">23 citations</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-secondary rounded">
          <span>ChatGPT</span>
          <span className="font-semibold">18 citations</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-secondary rounded">
          <span>Claude</span>
          <span className="font-semibold">12 citations</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SentimentAnalysis = () => (
  <Card className="shadow-card">
    <CardHeader>
      <CardTitle className="text-h3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent" />
        Sentiment Analysis
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-success">72%</div>
          <div className="text-caption text-muted-foreground">Positive</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-muted-foreground">23%</div>
          <div className="text-caption text-muted-foreground">Neutral</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-destructive">5%</div>
          <div className="text-caption text-muted-foreground">Negative</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AIRankings = () => (
  <Card className="shadow-card">
    <CardHeader>
      <CardTitle className="text-h3 flex items-center gap-2">
        <Target className="w-5 h-5 text-accent" />
        AI Rankings
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}>
          <span>"AI analytics tools"</span>
          <span className="font-semibold text-success">#3</span>
        </div>
        <div className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: 'hsl(var(--warning) / 0.1)' }}>
          <span>"search optimization"</span>
          <span className="font-semibold text-warning">#8</span>
        </div>
        <div className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)' }}>
          <span>"marketing analytics"</span>
          <span className="font-semibold text-destructive">#15</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PromptTrends = () => (
  <Card className="shadow-card">
    <CardHeader>
      <CardTitle className="text-h3 flex items-center gap-2">
        <Search className="w-5 h-5 text-accent" />
        Prompt Trends
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-success">↑</span>
          <span>"best AI analytics platform"</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-success">↑</span>
          <span>"AI search optimization tools"</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-destructive">↓</span>
          <span>"marketing automation"</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CompetitorTraffic = () => (
  <Card className="shadow-card">
    <CardHeader>
      <CardTitle className="text-h3 flex items-center gap-2">
        <Users className="w-5 h-5 text-accent" />
        Competitor Traffic
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span>Your Domain</span>
          <div className="w-24 h-4 bg-accent rounded"></div>
        </div>
        <div className="flex justify-between items-center">
          <span>Competitor A</span>
          <div className="w-16 h-4 bg-muted rounded"></div>
        </div>
        <div className="flex justify-between items-center">
          <span>Competitor B</span>
          <div className="w-12 h-4 bg-muted rounded"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const TrendingPages = () => (
  <Card className="shadow-card">
    <CardHeader>
      <CardTitle className="text-h3 flex items-center gap-2">
        <Globe className="w-5 h-5 text-accent" />
        Trending Pages
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between items-center p-2 bg-secondary rounded">
          <span>/blog/ai-analytics-guide</span>
          <span className="text-accent font-semibold">+127%</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-secondary rounded">
          <span>/features/sentiment-analysis</span>
          <span className="text-accent font-semibold">+89%</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-secondary rounded">
          <span>/pricing</span>
          <span className="text-accent font-semibold">+45%</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AppSidebar = () => {
  const menuItems = [
    { icon: BarChart3, label: "Overview", active: true },
    { icon: Brain, label: "AI Visibility" },
    { icon: TrendingUp, label: "Analytics" },
    { icon: Users, label: "Competitors" },
    { icon: Search, label: "Keywords" },
    { icon: Target, label: "Rankings" },
    { icon: Globe, label: "Pages" },
  ];

  return (
    <Sidebar className="w-64 bg-background border-r border-border">
      <SidebarContent className="p-4">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-foreground font-semibold text-xl">PulseSpark.ai</span>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <div 
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-base ${
                item.active ? 'bg-secondary text-accent' : 'hover:bg-secondary/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </SidebarContent>
    </Sidebar>
  );
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar />
          
          <main className="flex-1 p-6">
            <div className="mb-6">
              <SidebarTrigger className="mb-4" />
              <h1 className="text-h1 text-foreground font-semibold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Track your AI search presence across all platforms</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AIVisibilityScore />
              </div>
              <div>
                <SentimentAnalysis />
              </div>
              <CitationsTracking />
              <AIRankings />
              <PromptTrends />
              <CompetitorTraffic />
              <div className="lg:col-span-2">
                <TrendingPages />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Dashboard;