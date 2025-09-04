// src/pages/PerplexityOptimization.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Globe,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Sparkles,
  Download,
  RefreshCw
} from 'lucide-react';
import { DeepSeekAgent } from '@/services/deepseek';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/lib/toast';

const PerplexityOptimization = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const runOptimizationAnalysis = async () => {
    if (!url) {
      showToast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user has DeepSeek API key
      const { data: profile } = await supabase
        .from('profiles')
        .select('api_keys')
        .eq('user_id', user.id)
        .single();

      const apiKey = profile?.api_keys?.deepseek;
      
      if (!apiKey && !import.meta.env.VITE_DEEPSEEK_API_KEY) {
        showToast.error('Please add your DeepSeek API key in Settings');
        navigate('/settings');
        return;
      }

      const agent = new DeepSeekAgent(apiKey);
      const result = await agent.analyzeForPerplexity(url);
      
      // Save to database (create the table if it doesn't exist)
      try {
        await supabase
          .from('optimization_scans')
          .insert({
            user_id: user.id,
            url,
            analysis: result,
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.warn('Could not save to database - table may not exist yet:', dbError);
      }

      setAnalysis(result);
      showToast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis failed:', error);
      showToast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-accent';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Perplexity AI Optimization Suite
          </h1>
          <p className="text-muted-foreground">
            Analyze and optimize your website for maximum visibility in AI search results
          </p>
        </div>

        {/* URL Input */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Input
                type="url"
                placeholder="Enter your website URL (e.g., example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={runOptimizationAnalysis}
                disabled={loading || !url}
                className="px-6"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Website
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {analysis && (
          <>
            {/* Readiness Score */}
            <Card className="mb-6 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">
                      Perplexity Readiness Score
                    </h2>
                    <p className="opacity-90">
                      Your website's optimization level for AI search visibility
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary-foreground">
                      {analysis.readinessScore}
                    </div>
                    <Badge className="mt-2 bg-card text-card-foreground">
                      {getScoreLabel(analysis.readinessScore)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="entity">Entity Analysis</TabsTrigger>
                <TabsTrigger value="content">Content Depth</TabsTrigger>
                <TabsTrigger value="platforms">Platforms</TabsTrigger>
                <TabsTrigger value="actions">Action Plan</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Entity Strength */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        Entity Strength
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">
                        {analysis.entityAnalysis.brandStrength}%
                      </div>
                      <Progress value={analysis.entityAnalysis.brandStrength} />
                      <p className="text-sm text-muted-foreground mt-2">
                        Brand recognition as an entity
                      </p>
                    </CardContent>
                  </Card>

                  {/* Content Depth */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-secondary" />
                        Content Depth
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">
                        {analysis.contentAnalysis.depth}%
                      </div>
                      <Progress value={analysis.contentAnalysis.depth} />
                      <p className="text-sm text-muted-foreground mt-2">
                        Semantic cluster coverage
                      </p>
                    </CardContent>
                  </Card>

                  {/* Platform Coverage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-accent" />
                        Platform Coverage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">
                        {Object.values(analysis.platformPresence)
                          .filter((p: any) => p.found).length} / 5
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Platforms with presence
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Critical Issues */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Critical Optimization Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.recommendations.critical.map((rec: string, idx: number) => (
                        <Alert key={idx}>
                          <AlertDescription>{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="entity">
                <EntityAnalysisView data={analysis.entityAnalysis} />
              </TabsContent>

              <TabsContent value="content">
                <ContentAnalysisView data={analysis.contentAnalysis} />
              </TabsContent>

              <TabsContent value="platforms">
                <PlatformAnalysisView data={analysis.platformPresence} />
              </TabsContent>

              <TabsContent value="actions">
                <ActionPlanView recommendations={analysis.recommendations} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

// Entity Analysis Component
const EntityAnalysisView = ({ data }: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Brand Entity Recognition</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Entity Strength</p>
            <div className="text-3xl font-bold">{data.brandStrength}%</div>
            <Progress value={data.brandStrength} className="mt-2" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Brand Mentions</p>
            <div className="text-3xl font-bold">{data.mentions}</div>
            <p className="text-sm text-muted-foreground">Density: {data.density}%</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Authority Associations</CardTitle>
      </CardHeader>
      <CardContent>
        {data.authorityAssociations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.authorityAssociations.map((brand: string) => (
              <Badge key={brand} variant="secondary">
                {brand}
              </Badge>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              No authority brand associations found
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  </div>
);

// Content Analysis Component
const ContentAnalysisView = ({ data }: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Semantic Content Clusters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.clusters.map((cluster: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">{cluster.topic}</h4>
                <Badge>{cluster.pages} pages</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Average: {cluster.avgWords} words/page
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Content Gaps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.gaps.map((gap: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span>{gap}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Platform Analysis Component
const PlatformAnalysisView = ({ data }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Object.entries(data).map(([platform, info]: [string, any]) => (
      <Card key={platform}>
        <CardHeader>
          <CardTitle className="capitalize">{platform}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>Status:</span>
            {info.found ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
          </div>
          {info.found && (
            <div className="mt-2 text-sm text-muted-foreground">
              {platform === 'reddit' && `${info.mentions} mentions`}
              {platform === 'youtube' && `${info.videos} videos`}
              {platform === 'linkedin' && `${info.followers} followers`}
              {platform === 'quora' && `${info.questions} questions`}
              {platform === 'news' && `${info.articles} articles`}
            </div>
          )}
        </CardContent>
      </Card>
    ))}
  </div>
);

// Action Plan Component
const ActionPlanView = ({ recommendations }: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader className="bg-destructive/10">
        <CardTitle>🔴 Critical Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {recommendations.critical.map((action: string, idx: number) => (
            <div key={idx} className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p>{action}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="bg-warning/10">
        <CardTitle>🟡 Important Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {recommendations.important.map((action: string, idx: number) => (
            <div key={idx} className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <p>{action}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="bg-success/10">
        <CardTitle>🟢 Nice to Have</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {recommendations.nice_to_have.map((action: string, idx: number) => (
            <div key={idx} className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <p>{action}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default PerplexityOptimization;