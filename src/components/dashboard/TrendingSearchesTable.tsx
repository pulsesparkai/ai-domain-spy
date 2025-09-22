import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';

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

  const fetchTrendingSearches = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('https://api.pulsespark.ai/api/trending-searches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        showToast.error(`Error: ${response.status} - ${errorText}`);
        throw new Error(`Status: ${response.status}`);
      }

      const data = await response.json();
      setSearches(data.searches || []);
    } catch (error) {
      console.error('Error fetching trending searches:', error);
      showToast.error(error instanceof Error ? error.message : 'Failed to fetch trending searches');
      setSearches([]);
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
            {searches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No trending searches available. Run a scan first.
                </TableCell>
              </TableRow>
            ) : (
              searches.map((search) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TrendingSearchesTable;