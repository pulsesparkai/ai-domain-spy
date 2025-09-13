import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface TrendingSearch {
  id: string;
  query: string;
  volume: number;
  change: number;
  category: string;
  lastUpdated: string;
}

const TrendingSearchesTable: React.FC = () => {
  const [searches, setSearches] = useState<TrendingSearch[]>([]);
  const [loading, setLoading] = useState(false);

  const mockSearches: TrendingSearch[] = [
    {
      id: '1',
      query: 'AI tools for content creation',
      volume: 15400,
      change: 23.5,
      category: 'Technology',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2', 
      query: 'SEO optimization techniques',
      volume: 12300,
      change: -5.2,
      category: 'Marketing',
      lastUpdated: '2024-01-15'
    },
    {
      id: '3',
      query: 'Perplexity AI search trends',
      volume: 8900,
      change: 45.8,
      category: 'AI',
      lastUpdated: '2024-01-15'
    },
    {
      id: '4',
      query: 'Digital marketing strategies',
      volume: 22100,
      change: 12.3,
      category: 'Marketing',
      lastUpdated: '2024-01-15'
    },
  ];

  const fetchTrendingSearches = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.pulsespark.ai/api/trending-searches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        showToast.error('API Not Found', { description: 'Check backend URL' });
        // Use mock data as fallback
        setSearches(mockSearches);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setSearches(data.searches || mockSearches);
      } else {
        throw new Error('Failed to fetch trending searches');
      }
    } catch (error) {
      console.error('Error fetching trending searches:', error);
      showToast.error('Failed to fetch trending searches');
      // Use mock data as fallback
      setSearches(mockSearches);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingSearches();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trending Searches</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTrendingSearches}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searches.map((search) => (
              <TableRow key={search.id}>
                <TableCell className="font-medium">{search.query}</TableCell>
                <TableCell>{search.volume.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {search.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={search.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {search.change > 0 ? '+' : ''}{search.change}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{search.category}</Badge>
                </TableCell>
                <TableCell>{search.lastUpdated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TrendingSearchesTable;