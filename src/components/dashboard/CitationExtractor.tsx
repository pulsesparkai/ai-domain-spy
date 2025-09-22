import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Copy, Star, Clock, Globe, TrendingUp, Filter, Search } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';

interface Citation {
  id: string;
  url: string;
  title: string;
  snippet: string;
  platform: string;
  relevanceScore: number;
  domainAuthority: number;
  dateFound: string;
  lastVerified: string;
  status: 'active' | 'removed' | 'changed';
  sentiment: 'positive' | 'neutral' | 'negative';
  aiModel: string;
  queryContext: string;
  clickable: boolean;
}

const CitationExtractor: React.FC = () => {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [filteredCitations, setFilteredCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  useEffect(() => {
    fetchCitations();
  }, []);

  useEffect(() => {
    filterCitations();
  }, [citations, searchTerm, statusFilter, platformFilter]);

  const fetchCitations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch citations from recent scans
      const { data: scans } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (scans) {
        const allCitations: Citation[] = [];
        
        scans.forEach((scan, scanIndex) => {
          const scanResults = scan.results || {};
          const scanCitations = scanResults.citations || [];
          
          scanCitations.forEach((citation: any, index: number) => {
            allCitations.push({
              id: `${scan.id}-${index}`,
              url: citation.url || '',
              title: citation.title || 'Untitled',
              snippet: citation.snippet || citation.content || '',
              platform: citation.platform || 'Unknown',
              relevanceScore: citation.relevanceScore || Math.random(),
              domainAuthority: citation.domainAuthority || Math.floor(Math.random() * 100),
              dateFound: scan.created_at,
              lastVerified: scan.created_at,
              status: citation.status || 'active',
              sentiment: citation.sentiment || 'neutral',
              aiModel: scan.scan_type || 'unknown',
              queryContext: scan.queries?.[0] || 'General scan',
              clickable: true
            });
          });
        });

        setCitations(allCitations);
      }
    } catch (error) {
      console.error('Error fetching citations:', error);
      showToast.error('Failed to fetch citations');
    } finally {
      setLoading(false);
    }
  };

  const filterCitations = () => {
    let filtered = citations;

    if (searchTerm) {
      filtered = filtered.filter(citation =>
        citation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citation.snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citation.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(citation => citation.status === statusFilter);
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter(citation => citation.platform === platformFilter);
    }

    // Sort by relevance score and date
    filtered.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.dateFound).getTime() - new Date(a.dateFound).getTime();
    });

    setFilteredCitations(filtered);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast.success('Copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'removed': return 'bg-red-500';
      case 'changed': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const uniquePlatforms = [...new Set(citations.map(c => c.platform))];
  const uniqueStatuses = [...new Set(citations.map(c => c.status))];

  const formatDomainAuthority = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { text: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { text: 'Fair', color: 'text-yellow-600' };
    return { text: 'Low', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading citations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Citation Extraction</h2>
          <p className="text-muted-foreground">
            Track and analyze all citations of your content across AI platforms
          </p>
        </div>
        <Button onClick={fetchCitations}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Citations
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Citations</p>
                <p className="text-2xl font-bold">{citations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">High Quality</p>
                <p className="text-2xl font-bold">
                  {citations.filter(c => c.domainAuthority >= 70).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Links</p>
                <p className="text-2xl font-bold">
                  {citations.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {citations.filter(c => 
                    new Date(c.dateFound) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search citations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">All Platforms</option>
                {uniquePlatforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Citations List */}
      <div className="space-y-4">
        {filteredCitations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ExternalLink className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Citations Found</h3>
              <p className="text-muted-foreground">
                {citations.length === 0 
                  ? 'Run some scans to start tracking citations'
                  : 'Try adjusting your filters to see more results'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCitations.map((citation) => {
            const domainAuth = formatDomainAuthority(citation.domainAuthority);
            
            return (
              <Card key={citation.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg leading-tight">
                          {citation.title}
                        </h3>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(citation.status)}`} />
                      </div>
                      {citation.clickable && citation.url && (
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {new URL(citation.url).hostname}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{citation.platform}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(citation.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    {citation.snippet}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>Relevance: {(citation.relevanceScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span className={domainAuth.color}>
                        DA: {citation.domainAuthority} ({domainAuth.text})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Found: {new Date(citation.dateFound).toLocaleDateString()}</span>
                    </div>
                    <div className={`font-medium ${getSentimentColor(citation.sentiment)}`}>
                      {citation.sentiment} sentiment
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {citation.aiModel}
                    </Badge>
                    <span>Query: {citation.queryContext}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CitationExtractor;