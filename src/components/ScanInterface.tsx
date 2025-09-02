import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Info, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import ScanProgressBar from "./ScanProgressBar";
import { useMockData } from "@/hooks/useMockData";
import { lazy, Suspense } from "react";

// Lazy load Recharts components
const LazyPieChart = lazy(() => import("recharts").then(module => ({ default: module.PieChart })));
const LazyBarChart = lazy(() => import("recharts").then(module => ({ default: module.BarChart })));

const ScanInterface = () => {
  const [queries, setQueries] = useState<string[]>([""]);
  const [scanType, setScanType] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  const { devMode, mockScanResults } = useMockData();

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

    setIsScanning(true);
    setProgress(0);

    try {
      if (devMode) {
        // Mock scanning with progress
        for (let i = 0; i <= 100; i += 20) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        setResults(mockScanResults);
      } else {
        // Real API call logic would go here
        // For now, simulate the process
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            queries: queries.filter(q => q.trim()),
            scanType,
            targetUrl
          })
        });

        if (!response.ok) {
          throw new Error('Scan failed');
        }

        const data = await response.json();
        setResults(data);
      }
      
      showToast.success("Scan completed successfully!");
    } catch (error) {
      showToast.error("Scan failed. Please try again.");
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
    <TooltipProvider>
      <div className="space-y-6">
        <ScanProgressBar progress={progress} isVisible={isScanning} />
        
        <Card>
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
                      "rounded-lg",
                      errors.includes(`Query ${index + 1} is required`) && "border-destructive"
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
            </div>

            <div>
              <Label>Scan Type</Label>
              <Select value={scanType} onValueChange={setScanType}>
                <SelectTrigger className={cn(
                  "rounded-lg bg-card",
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
              className="w-full"
            >
              {isScanning ? "Scanning..." : "Start Scan"}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
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
                <CardTitle>Ranking Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ScanInterface;