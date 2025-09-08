import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const RankingsCard = ({ scanData }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🏆</span> Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Track your rankings across AI platforms
          </p>
        </div>
      </CardContent>
    </Card>
  );
};