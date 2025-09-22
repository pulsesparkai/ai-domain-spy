import { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data }: any) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } = module;
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#8b5cf6">
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }))
);

export const CompetitorAnalysis = ({ domain, score }: { domain?: string; score?: number }) => {
  const competitors = [
    { name: 'Your Site', score: score || 75, change: 5, color: '#8b5cf6' },
    { name: 'Competitor A', score: 82, change: -2, color: '#ef4444' },
    { name: 'Competitor B', score: 68, change: 3, color: '#3b82f6' },
    { name: 'Industry Avg', score: 72, change: 1, color: '#6b7280' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitor Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="w-full h-[200px]" />}>
          <LazyBarChart data={competitors} />
        </Suspense>
        
        <div className="mt-4 space-y-2">
          {competitors.map((comp) => (
            <div key={comp.name} className="flex items-center justify-between p-2 rounded hover:bg-muted">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: comp.color }} />
                <span className="text-sm font-medium">{comp.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{comp.score}</span>
                {comp.change > 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
                {comp.change < 0 && <TrendingDown className="w-4 h-4 text-red-500" />}
                {comp.change === 0 && <Minus className="w-4 h-4 text-gray-500" />}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};