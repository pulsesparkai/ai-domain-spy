import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PlatformDistribution = ({ platformData }: any) => {
  const data = [
    { name: 'Reddit', value: 35, color: '#ff4500' },
    { name: 'YouTube', value: 28, color: '#ff0000' },
    { name: 'LinkedIn', value: 20, color: '#0077b5' },
    { name: 'Quora', value: 12, color: '#b92b27' },
    { name: 'News', value: 5, color: '#1a1a1a' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};