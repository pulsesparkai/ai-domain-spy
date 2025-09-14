import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Link, TrendingUp, AlertCircle } from 'lucide-react';

export const DomainAnalysis = ({ data }) => {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">No domain analysis data available</p>
        </CardContent>
      </Card>
    );
  }

  const platformPresence = data.platformPresence || {};
  const recommendations = data.recommendations || {};

  return (
    <div className="space-y-6">
      {/* Platform Presence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(platformPresence).map(([platform, info]) => {
              const platformInfo = info as any; // Type assertion for platform data
              return (
                <div key={platform} className="flex items-center justify-between">
                  <span className="capitalize">{platform}</span>
                  <Badge variant={platformInfo?.found ? 'default' : 'secondary'}>
                    {platformInfo?.found ? `${platformInfo.mentions || platformInfo.videos || platformInfo.followers || 0}` : 'Not Found'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.critical?.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Critical</h4>
                <ul className="space-y-1">
                  {recommendations.critical.map((rec, i) => (
                    <li key={i} className="text-sm text-gray-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {recommendations.important?.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">Important</h4>
                <ul className="space-y-1">
                  {recommendations.important.map((rec, i) => (
                    <li key={i} className="text-sm text-gray-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};