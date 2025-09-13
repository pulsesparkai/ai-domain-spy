import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Ranking {
  id: string;
  query: string;
  position: number;
  previousPosition?: number;
  volume: number;
  difficulty: number;
  platform: string;
}

const RankingsTable: React.FC = () => {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(false);

  const mockRankings: Ranking[] = [
    {
      id: '1',
      query: 'AI SEO tools',
      position: 3,
      previousPosition: 5,
      volume: 12000,
      difficulty: 65,
      platform: 'Perplexity'
    },
    {
      id: '2',
      query: 'content optimization',
      position: 1,
      previousPosition: 1,
      volume: 8500,
      difficulty: 45,
      platform: 'Perplexity'
    },
    {
      id: '3',
      query: 'search visibility tools',
      position: 7,
      previousPosition: 4,
      volume: 5200,
      difficulty: 72,
      platform: 'Perplexity'
    },
    {
      id: '4',
      query: 'AI content analysis',
      position: 2,
      previousPosition: 3,
      volume: 9800,
      difficulty: 58,
      platform: 'Perplexity'
    },
  ];

  const fetchRankings = async () => {
    setLoading(true);
    try {
      // Simulate API call - in real implementation this would fetch from Perplexity API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRankings(mockRankings);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const getPositionChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = previous - current;
    if (change > 0) return { type: 'up', value: change };
    if (change < 0) return { type: 'down', value: Math.abs(change) };
    return { type: 'same', value: 0 };
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 40) return 'bg-green-100 text-green-800';
    if (difficulty < 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Perplexity Rankings</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRankings}
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
              <TableHead>Position</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Platform</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((ranking) => {
              const change = getPositionChange(ranking.position, ranking.previousPosition);
              
              return (
                <TableRow key={ranking.id}>
                  <TableCell className="font-medium">{ranking.query}</TableCell>
                  <TableCell>
                    <Badge variant={ranking.position <= 3 ? "default" : "secondary"}>
                      #{ranking.position}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {change && (
                      <div className="flex items-center gap-1">
                        {change.type === 'up' && (
                          <ArrowUp className="w-4 h-4 text-green-600" />
                        )}
                        {change.type === 'down' && (
                          <ArrowDown className="w-4 h-4 text-red-600" />
                        )}
                        {change.type === 'same' && (
                          <Minus className="w-4 h-4 text-gray-600" />
                        )}
                        <span className={
                          change.type === 'up' ? 'text-green-600' :
                          change.type === 'down' ? 'text-red-600' :
                          'text-gray-600'
                        }>
                          {change.value > 0 ? change.value : '-'}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{ranking.volume.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(ranking.difficulty)}>
                      {ranking.difficulty}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ranking.platform}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RankingsTable;