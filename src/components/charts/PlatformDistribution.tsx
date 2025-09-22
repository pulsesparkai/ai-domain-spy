import { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LazyPieChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data, renderCustomizedLabel }: any) => {
      const { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } = module;
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  }))
);

export const PlatformDistribution = ({ platformData }: any) => {
  if (!platformData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No platform data available</p>
        </CardContent>
      </Card>
    );
  }

  const data = Object.entries(platformData).map(([name, info]: any) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: info.found ? (info.mentions || info.videos || info.followers || info.questions || info.articles || 1) : 0,
    color: {
      reddit: '#ff4500',
      youtube: '#ff0000',
      linkedin: '#0077b5',
      quora: '#b92b27',
      news: '#1a1a1a'
    }[name] || '#8b5cf6'
  })).filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No platform presence detected</p>
        </CardContent>
      </Card>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="w-full h-[300px]" />}>
          <LazyPieChart data={data} renderCustomizedLabel={renderCustomizedLabel} />
        </Suspense>
      </CardContent>
    </Card>
  );
};