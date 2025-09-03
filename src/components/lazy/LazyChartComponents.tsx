// Consolidated lazy chart components for better code splitting
import { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Chart skeleton components
const BarChartSkeleton = () => (
  <div className="h-64 flex flex-col space-y-2">
    <div className="flex-1 flex items-end space-x-2">
      <Skeleton className="w-8 h-32" />
      <Skeleton className="w-8 h-24" />
      <Skeleton className="w-8 h-40" />
      <Skeleton className="w-8 h-28" />
      <Skeleton className="w-8 h-36" />
    </div>
    <Skeleton className="h-4 w-full" />
  </div>
);

const PieChartSkeleton = () => (
  <div className="h-64 flex items-center justify-center">
    <Skeleton className="w-48 h-48 rounded-full" />
  </div>
);

const LineChartSkeleton = () => (
  <div className="h-64 flex flex-col space-y-2">
    <div className="flex-1 relative">
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center">
        <svg className="w-full h-full">
          <path 
            d="M20,180 Q40,120 80,140 T160,100 T240,120 T320,80" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            className="text-muted-foreground animate-pulse"
          />
        </svg>
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
  </div>
);

// Lazy chart component types
interface LazyBarChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
}

interface LazyPieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  height?: number;
  colors?: string[];
}

// Lazy Bar Chart
export const LazyBarChart = ({ 
  data, 
  dataKey, 
  xAxisKey, 
  height = 300, 
  color = "#8884d8"
}: LazyBarChartProps) => {
  const BarChartComponent = lazy(() => 
    import('recharts').then(module => ({
      default: ({ data, dataKey, xAxisKey, height, color }: LazyBarChartProps) => {
        const { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } = module;
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }))
  );

  return (
    <Suspense fallback={<BarChartSkeleton />}>
      <BarChartComponent 
        data={data} 
        dataKey={dataKey} 
        xAxisKey={xAxisKey} 
        height={height} 
        color={color} 
      />
    </Suspense>
  );
};

// Lazy Pie Chart
export const LazyPieChart = ({ 
  data, 
  dataKey, 
  nameKey, 
  height = 300, 
  colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]
}: LazyPieChartProps) => {
  const PieChartComponent = lazy(() => 
    import('recharts').then(module => ({
      default: ({ data, dataKey, nameKey, height, colors }: LazyPieChartProps) => {
        const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = module;
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey={nameKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      }
    }))
  );

  return (
    <Suspense fallback={<PieChartSkeleton />}>
      <PieChartComponent 
        data={data} 
        dataKey={dataKey} 
        nameKey={nameKey} 
        height={height} 
        colors={colors} 
      />
    </Suspense>
  );
};

// Export skeleton components for direct use
export { BarChartSkeleton, PieChartSkeleton, LineChartSkeleton };