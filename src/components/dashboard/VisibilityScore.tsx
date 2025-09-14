import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export const VisibilityScore = ({ data }) => {
  const score = data?.readinessScore || 0;
  const metrics = [
    { label: 'AI Readiness', value: score, max: 100 },
    { label: 'Content Depth', value: data?.contentAnalysis?.depth || 0, max: 100 },
    { label: 'Authority Score', value: data?.entityAnalysis?.brandStrength || 0, max: 100 },
    { label: 'Citations', value: data?.citations?.length || 0, isCount: true }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {metric.isCount ? (
                  metric.value
                ) : (
                  `${metric.value}%`
                )}
              </div>
              {!metric.isCount && (
                <Progress value={metric.value} max={metric.max} className="h-2" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};