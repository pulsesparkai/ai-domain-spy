import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CitationsTracking = ({ scanData }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span> Citations Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="text-5xl font-bold text-primary">
            {scanData?.entityAnalysis?.mentions || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Total Citations
          </p>
          {!scanData && (
            <p className="text-xs text-muted-foreground mt-4">
              No citations found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};