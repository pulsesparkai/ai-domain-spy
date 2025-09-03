import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipWrapper } from "@/components/TooltipWrapper";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Info, Plus, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import ScanProgressBar from "./ScanProgressBar";
import ScanInterfaceErrorBoundary from "./ScanInterfaceErrorBoundary";
import { useMockData } from "@/hooks/useMockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lazy, Suspense } from "react";
import { analytics } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
import { useSupabaseReady, withDependencyCheck } from "@/lib/dependency-hooks";
import { getRateLimiter } from "@/lib/rate-limiter";
import { RateLimitStatusWidget } from "@/components/RateLimitStatus";
import { performScan } from "@/lib/api-client";

// Lazy load Recharts components
const LazyPieChart = lazy(() => import("recharts").then(module => ({ default: module.PieChart })));
const LazyBarChart = lazy(() => import("recharts").then(module => ({ default: module.BarChart })));

const ScanInterface = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<string[]>([""]);
  const [scanType, setScanType] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  const { devMode, mockScanResults } = useMockData();
  const { user, session, apiKeys, profile } = useAuth();
  const { isReady: supabaseReady, error: supabaseError } = useSupabaseReady();
  
  // Get user tier for rate limiting
  const userTier = profile?.subscription_status === 'active' ? 'paid' : 'free';
  const rateLimiter = getRateLimiter(userTier, 'scan');

  const handleRetry = () => {
    setResults(null);
    setErrors([]);
    setProgress(0);
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  const validateInputs = () => {
    const newErrors: string[] = [];
    queries.forEach((query, index) => {
      if (!query.trim()) {
        newErrors.push(`Query ${index + 1} is required`);
      }
    });
    if (!scanType) newErrors.push("Scan type is required");
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const addQuery = () => {
    setQueries([...queries, ""]);
  };

  const removeQuery = (index: number) => {
    if (queries.length > 1) {
      setQueries(queries.filter((_, i) => i !== index));
    }
  };

  const updateQuery = (index: number, value: string) => {
    const newQueries = [...queries];
    newQueries[index] = value;
    setQueries(newQueries);
  };

  const handleScan = async () => {
    if (!validateInputs()) {
      showToast.error("Please fill in all required fields");
      return;
    }

    if (!user) {
      showToast.error("Please log in to perform scans");
      return;
    }

    if (!supabaseReady) {
      showToast.error("Database connection not ready. Please wait and try again.");
      return;
    }

    // Check rate limiting before proceeding
    try {
      const canProceed = await rateLimiter.requestToken();
      if (!canProceed) {
        return; // Request was queued, toast already shown
      }
    } catch (error) {
      showToast.error("Rate limit exceeded. Please try again later.");
      return;
    }

    setIsScanning(true);
    setProgress(0);

    try {
      // Track analytics event
      analytics.track('scan_run', {
        scan_type: scanType,
        query_count: queries.length,
        user_id: user.id
      });

      // Check if user has required API keys
      const hasPerplexity = apiKeys.perplexity;
      const hasOpenAI = apiKeys.openai;
      
      if (devMode || (!hasPerplexity && !hasOpenAI)) {
        // Mock scanning with progress for dev mode or missing API keys
        for (let i = 0; i <= 100; i += 20) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (!hasPerplexity && !hasOpenAI) {
          showToast.error("API keys required. Please add Perplexity or OpenAI keys in Settings.");
        } else if (!hasPerplexity) {
          showToast.error("Perplexity API key recommended for best results. Add it in Settings.");
        }
        
        setResults(mockScanResults);
      } else {
        // Real API call using dependency validation and centralized client
        try {
          await withDependencyCheck(['supabase'], async () => {
            const data = await performScan({
              queries: queries.filter(q => q.trim()),
              scanType,
              targetUrl
            });
            
            setResults(data.results);
            
            // Show API key warnings if some failed
            if (data.results?.some((r: any) => r.error?.includes('Invalid'))) {
              showToast.error("Some API keys are invalid. Check Settings for details.");
            }
          }, {
            timeout: 10000,
            fallback: () => {
              throw new Error('Database connection failed - scan cannot proceed');
            }
          });
        } catch (dependencyError) {
          throw dependencyError;
        }

        // Rate limit success feedback is handled by the rate limiter
      }
      
      showToast.success("Scan completed successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scan failed';
      showToast.error(errorMessage);
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  };

  const sentimentColors = {
    positive: "#4CAF50",
    neutral: "#9E9E9E", 
    negative: "#F44336"
  };

  const sentimentData = results?.aggregates?.sentimentBreakdown ? [
    { name: 'Positive', value: results.aggregates.sentimentBreakdown.positive, color: sentimentColors.positive },
    { name: 'Neutral', value: results.aggregates.sentimentBreakdown.neutral, color: sentimentColors.neutral },
    { name: 'Negative', value: results.aggregates.sentimentBreakdown.negative, color: sentimentColors.negative },
  ] : [];

  return (
    <ScanInterfaceErrorBoundary
      onRetry={handleRetry}
      onNavigateToSettings={handleNavigateToSettings}
    >
      <TooltipProvider>
        <div className="space-y-6">
          <ScanProgressBar progress={progress} isVisible={isScanning} />
          
          {/* Rate Limit Status Widget */}
          <RateLimitStatusWidget 
            rateLimiter={rateLimiter} 
            className="max-w-md"
          />
          
          <Card className="scan-interface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                AI Visibility Scan
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-muted border border-input-border rounded-xl p-3 max-w-xs">
                    <p className="text-sm">
                      Track your brand mentions across AI search platforms and analyze sentiment.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Search Queries</Label>
                {queries.map((query, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={query}
                      onChange={(e) => updateQuery(index, e.target.value)}
                      placeholder="Enter search query..."
                      className={cn(
                        "rounded-lg domain-input",
                        errors.includes(`Query ${index + 1} is required`) && "border-red-500 border-2"
                      )}
                    />
                    {queries.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeQuery(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addQuery} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Query
                </Button>
                {errors.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Please fix the following errors:</span>
                    </div>
                    <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <Label>Scan Type</Label>
                <Select value={scanType} onValueChange={setScanType}>
                  <SelectTrigger className={cn(
                    "rounded-lg bg-card scan-type-select",
                    !scanType && errors.includes("Scan type is required") && "border-destructive"
                  )}>
                    <SelectValue placeholder="Select scan type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-input-border rounded-lg">
                    <SelectItem value="brand-monitoring" className="text-foreground">Brand Monitoring</SelectItem>
                    <SelectItem value="competitor-analysis" className="text-foreground">Competitor Analysis</SelectItem>
                    <SelectItem value="trend-tracking" className="text-foreground">Trend Tracking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target URL (Optional)</Label>
                <Input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="rounded-lg"
                />
              </div>

              <Button 
                onClick={handleScan} 
                disabled={isScanning}
                className={cn(
                  "w-full start-scan-button",
                  isScanning && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Run AI Scan"
              >
                {isScanning ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" 
                         style={{ borderColor: '#4A90E2', borderTopColor: 'transparent' }}></div>
                    Scanning...
                  </div>
                ) : (
                  "Start Scan"
                )}
              </Button>
            </CardContent>
          </Card>

          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 scan-results">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Sentiment Analysis
                    <TooltipWrapper
                      id="sentiment-tooltip"
                      content="Shows the emotional tone of mentions: positive, neutral, or negative sentiment across all platforms"
                    >
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipWrapper>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div>Loading chart...</div>}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LazyPieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </LazyPieChart>
                    </ResponsiveContainer>
                  </Suspense>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    AI Visibility Score
                    <TooltipWrapper
                      id="visibility-tooltip"
                      content="Composite score: (primary*10 + secondary*5 + mentions*2)/total *100. Higher scores indicate better AI platform visibility"
                    >
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipWrapper>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 visibility-score">
                    <div className="flex justify-between">
                      <span>Primary Mentions</span>
                      <Badge variant="default">{results.aggregates?.primaryRank || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Secondary Mentions</span>
                      <Badge variant="secondary">{results.aggregates?.secondaryRank || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>No Ranking</span>
                      <Badge variant="outline">{results.aggregates?.noRank || 0}</Badge>
                    </div>
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {results.aggregates?.visibilityScore || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Visibility Score</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </TooltipProvider>
    </ScanInterfaceErrorBoundary>
  );
};

export default ScanInterface;