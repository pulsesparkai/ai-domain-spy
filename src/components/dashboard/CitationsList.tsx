import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Citation {
  id: string;
  title: string;
  url: string;
  source: string;
  relevanceScore: number;
  platform: string;
  snippet: string;
}

interface CitationsListProps {
  citations?: Citation[];
}

const CitationsList: React.FC<CitationsListProps> = ({ citations = [] }) => {
  const mockCitations: Citation[] = [
    {
      id: '1',
      title: 'Understanding AI-Powered SEO Tools',
      url: 'https://example.com/ai-seo-tools',
      source: 'TechCrunch',
      relevanceScore: 95,
      platform: 'News',
      snippet: 'AI-powered SEO tools are revolutionizing how businesses approach search optimization...'
    },
    {
      id: '2',
      title: 'The Future of Search Engine Optimization',
      url: 'https://reddit.com/r/seo/ai-future',
      source: 'Reddit - r/SEO',
      relevanceScore: 88,
      platform: 'Reddit',
      snippet: 'Discussion about how AI will change SEO practices in the coming years...'
    },
    {
      id: '3',
      title: 'Perplexity AI vs Traditional Search',
      url: 'https://youtube.com/watch?v=example',
      source: 'YouTube',
      relevanceScore: 92,
      platform: 'YouTube',
      snippet: 'Comprehensive comparison between Perplexity AI and traditional search engines...'
    },
  ];

  const displayCitations = citations.length > 0 ? citations : mockCitations;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast.success('Copied to clipboard');
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'reddit': return 'bg-orange-100 text-orange-800';
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'news': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Citations & References</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayCitations.map((citation) => (
          <div key={citation.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">{citation.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{citation.snippet}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Source: {citation.source}</span>
                  <Badge className={getPlatformColor(citation.platform)}>
                    {citation.platform}
                  </Badge>
                  <Badge variant="outline">
                    {citation.relevanceScore}% relevant
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(citation.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Source
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(citation.url)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CitationsList;