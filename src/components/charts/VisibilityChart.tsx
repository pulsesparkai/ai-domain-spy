import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const VisibilityChart = ({ data }: any) => {
  const chartData = [
    { date: '7 days ago', score: 45, citations: 12 },
    { date: '6 days ago', score: 48, citations: 15 },
    { date: '5 days ago', score: 52, citations: 18 },
    { date: '4 days ago', score: 58, citations: 22 },
    { date: '3 days ago', score: 65, citations: 28 },
    { date: '2 days ago', score: 70, citations: 32 },
    { date: 'Today', score: data?.readinessScore || 75, citations: 35 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visibility Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
            <Area type="monotone" dataKey="citations" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};