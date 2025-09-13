import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  TrendingUp, 
  Search, 
  RefreshCw,
  BarChart3,
  ExternalLink,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from './ui/alert';

interface TrendsSearchProps {
  onTrendsLoad?: (data: any) => void;
}

interface TrendItem {
  query: string;
  volumeEstimate: string;
  relatedDomains: string[];
  pathToSite: string;
}

interface TrendsData {
  trends: TrendItem[];
  cached: boolean;
  domain?: string;
  cachedAt?: string;
}

export const TrendsSearch = ({ onTrendsLoad }: TrendsSearchProps) => {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load general trends on component mount
  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async (searchDomain?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pulsespark.ai';
      const url = new URL(`${API_BASE_URL}/api/trending-searches`);
      
      if (searchDomain?.trim()) {
        url.searchParams.set('domain', searchDomain.trim());
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.trends) {
        setTrendsData(data);
        onTrendsLoad?.(data);
        
        toast({
          title: "Trends Loaded",
          description: `Found ${data.trends.length} trending searches${data.cached ? ' (cached)' : ''}`
        });
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error: any) {
      console.error('Trends loading error:', error);
      const errorMessage = error.message || 'Failed to load trends. Please try again.';
      setError(errorMessage);
      toast({
        title: "Failed to Load Trends",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadTrends(domain);
  };

  const handleRefresh = () => {
    loadTrends(trendsData?.domain);
  };

  const getVolumeColor = (volume: string) => {
    switch (volume.toLowerCase()) {
      case 'very high': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVolumeIcon = (volume: string) => {
    switch (volume.toLowerCase()) {
      case 'very high': return <ArrowUp className="h-3 w-3 text-red-600" />;
      case 'high': return <ArrowUp className="h-3 w-3 text-orange-600" />;
      case 'medium': return <Minus className="h-3 w-3 text-yellow-600" />;
      case 'low': return <ArrowDown className="h-3 w-3 text-green-600" />;
      default: return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Searches Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter domain for targeted trends (optional - leave blank for general trends)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
            {trendsData && (
              <Button 
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Discover trending searches on Perplexity AI and analyze paths to reach your site through these trends.
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {trendsData && (
        <div className="space-y-6">
          {/* Trends Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Trending Searches
                </CardTitle>
                <div className="flex items-center gap-2">
                  {trendsData.cached && (
                    <Badge variant="outline" className="text-blue-600">
                      Cached Data
                    </Badge>
                  )}
                  {trendsData.domain && (
                    <Badge variant="secondary">
                      {trendsData.domain}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">{trendsData.trends.length}</div>
                  <div className="text-sm text-muted-foreground">Total Trends</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-600">
                    {trendsData.trends.filter(t => t.volumeEstimate.toLowerCase().includes('high')).length}
                  </div>
                  <div className="text-sm text-muted-foreground">High Volume</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-blue-600">
                    {trendsData.trends.reduce((acc, t) => acc + t.relatedDomains.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Related Domains</div>
                </div>
              </div>
              
              {trendsData.cachedAt && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(trendsData.cachedAt).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trends Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Trends Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Related Domains</TableHead>
                    <TableHead>Path to Site</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trendsData.trends.map((trend, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{trend.query}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getVolumeColor(trend.volumeEstimate)} border-0`}>
                          <div className="flex items-center gap-1">
                            {getVolumeIcon(trend.volumeEstimate)}
                            {trend.volumeEstimate}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {trend.relatedDomains.slice(0, 3).map((domain, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-sm">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{domain}</span>
                            </div>
                          ))}
                          {trend.relatedDomains.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{trend.relatedDomains.length - 3} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs">
                          {trend.pathToSite}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Optimization Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Key Insights & Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <h4 className="font-medium text-green-800 mb-2">High Opportunity Trends</h4>
                  <div className="space-y-1">
                    {trendsData.trends
                      .filter(t => t.volumeEstimate.toLowerCase().includes('high'))
                      .slice(0, 3)
                      .map((trend, idx) => (
                        <div key={idx} className="text-sm text-green-700">
                          • {trend.query}
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <h4 className="font-medium text-blue-800 mb-2">Content Strategy Recommendations</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div>• Create content targeting high-volume trending queries</div>
                    <div>• Build relationships with related domains for backlinks</div>
                    <div>• Optimize existing content for semantic relevance</div>
                    <div>• Monitor trending topics for content opportunities</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};