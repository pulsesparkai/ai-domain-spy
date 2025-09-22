import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight,
  Calendar,
  Users,
  Globe,
  BookOpen,
  Target,
  Eye,
  Star,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ScanRecord } from "@/store/scanHistoryStore";
import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LazyLineChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data }: any) => {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } = module;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="readinessScore" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data }: any) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } = module;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar 
              dataKey="citationsCount" 
              fill="#3b82f6" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }))
);

interface ScanComparisonProps {
  scans: ScanRecord[];
  onClose: () => void;
}

export const ScanComparison = ({ scans, onClose }: ScanComparisonProps) => {
  if (!scans || scans.length < 2) {
    return null;
  }

  // Prepare comparison data
  const comparisonData = scans.map(scan => ({
    date: format(new Date(scan.created_at), 'MMM dd'),
    readinessScore: scan.results?.readinessScore || 0,
    citationsCount: scan.results?.citations?.length || 0,
    platformPresence: Object.values(scan.results?.platformPresence || {}).filter(Boolean).length,
    brandMentions: scan.results?.entityAnalysis?.brandMentions || 0,
    contentDepth: scan.results?.entityAnalysis?.contentDepth || 0,
    authorityScore: scan.results?.entityAnalysis?.authorityScore || 0
  }));

  // Calculate trends
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return ((last - first) / first) * 100;
  };

  const readinessScoreTrend = calculateTrend(comparisonData.map(d => d.readinessScore));
  const citationsTrend = calculateTrend(comparisonData.map(d => d.citationsCount));
  const platformTrend = calculateTrend(comparisonData.map(d => d.platformPresence));

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 5) return "text-green-600";
    if (trend < -5) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Scan Comparison</h2>
          <p className="text-muted-foreground">
            Comparing {scans.length} scans from {format(new Date(scans[scans.length - 1].created_at), 'MMM dd')} 
            to {format(new Date(scans[0].created_at), 'MMM dd')}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Readiness Score</p>
                <p className="text-2xl font-bold">
                  {comparisonData[comparisonData.length - 1].readinessScore}
                </p>
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(readinessScoreTrend)}`}>
                  {getTrendIcon(readinessScoreTrend)}
                  {Math.abs(readinessScoreTrend).toFixed(1)}%
                </div>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Citations</p>
                <p className="text-2xl font-bold">
                  {comparisonData[comparisonData.length - 1].citationsCount}
                </p>
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(citationsTrend)}`}>
                  {getTrendIcon(citationsTrend)}
                  {Math.abs(citationsTrend).toFixed(1)}%
                </div>
              </div>
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Platform Presence</p>
                <p className="text-2xl font-bold">
                  {comparisonData[comparisonData.length - 1].platformPresence}
                </p>
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(platformTrend)}`}>
                  {getTrendIcon(platformTrend)}
                  {Math.abs(platformTrend).toFixed(1)}%
                </div>
              </div>
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Readiness Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Suspense fallback={<Skeleton className="w-full h-64" />}>
                <LazyLineChart data={comparisonData} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        {/* Citations Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Citations Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Suspense fallback={<Skeleton className="w-full h-64" />}>
                <LazyBarChart data={comparisonData} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side-by-Side Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-full">
              {scans.map((scan, index) => (
                <div key={scan.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      Scan {index + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(scan.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Readiness Score</span>
                        <span className="text-lg font-bold">
                          {scan.results?.readinessScore || 0}
                        </span>
                      </div>
                      <Progress value={scan.results?.readinessScore || 0} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Citations</span>
                        <span className="font-semibold">
                          {scan.results?.citations?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Platform Presence</span>
                        <span className="font-semibold">
                          {Object.values(scan.results?.platformPresence || {}).filter(Boolean).length}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Brand Mentions</span>
                        <span className="font-semibold">
                          {scan.results?.entityAnalysis?.brandMentions || 0}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Authority Score</span>
                        <span className="font-semibold">
                          {scan.results?.entityAnalysis?.authorityScore || 0}%
                        </span>
                      </div>
                      <Progress value={scan.results?.entityAnalysis?.authorityScore || 0} className="h-2" />
                    </div>
                  </div>

                  {scan.target_url && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground truncate">
                        {scan.target_url}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Areas Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Areas Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">Areas of Growth</h4>
              <div className="space-y-2">
                {readinessScoreTrend > 5 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Readiness score improved by {readinessScoreTrend.toFixed(1)}%
                  </div>
                )}
                {citationsTrend > 5 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Citations increased by {citationsTrend.toFixed(1)}%
                  </div>
                )}
                {platformTrend > 5 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Platform presence expanded by {platformTrend.toFixed(1)}%
                  </div>
                )}
                {readinessScoreTrend <= 5 && citationsTrend <= 5 && platformTrend <= 5 && (
                  <p className="text-sm text-muted-foreground">
                    Focus on creating more authoritative content to see growth in the next scan.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-orange-600">Areas Needing Attention</h4>
              <div className="space-y-2">
                {readinessScoreTrend < -5 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    Readiness score declined by {Math.abs(readinessScoreTrend).toFixed(1)}%
                  </div>
                )}
                {citationsTrend < -5 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    Citations decreased by {Math.abs(citationsTrend).toFixed(1)}%
                  </div>
                )}
                {comparisonData[comparisonData.length - 1].readinessScore < 60 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-orange-600" />
                    Readiness score below recommended threshold
                  </div>
                )}
                {comparisonData[comparisonData.length - 1].citationsCount < 3 && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                    Low citation count - focus on building authority
                  </div>
                )}
                {readinessScoreTrend >= -5 && citationsTrend >= -5 && 
                 comparisonData[comparisonData.length - 1].readinessScore >= 60 && 
                 comparisonData[comparisonData.length - 1].citationsCount >= 3 && (
                  <p className="text-sm text-muted-foreground">
                    All metrics are performing well. Continue current strategy.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};