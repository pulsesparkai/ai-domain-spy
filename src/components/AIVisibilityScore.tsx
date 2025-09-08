import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AIVisibilityScore = ({ scanData }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯</span> AI Visibility Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="text-5xl font-bold text-primary">
            {scanData?.readinessScore || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Needs improvement visibility across AI platforms
          </p>
        </div>
      </CardContent>
    </Card>
  );
};